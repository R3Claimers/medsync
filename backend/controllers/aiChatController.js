const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const geminiAI = require('../services/geminiAI');
const { v4: uuidv4 } = require('uuid');

// Create a new chat session
exports.createChatSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionType = 'general' } = req.body;

    // Get user details for context
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build context based on user role
    let context = {
      userRole: user.role,
      hospitalId: user.hospitalId,
      sessionType: sessionType
    };

    // Add role-specific context
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (patient) {
        context.patientId = patient._id;
      }
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor) {
        context.doctorId = doctor._id;
      }
    }

    // Create new chat session
    const sessionId = uuidv4();
    const chatSession = new ChatSession({
      user: userId,
      sessionId: sessionId,
      context: context,
      messages: [{
        role: 'assistant',
        content: `Hello ${user.name}! I'm MedSync AI, your healthcare assistant. I'm here to help you with health questions, hospital navigation, and general medical information. How can I assist you today?`,
        timestamp: new Date(),
        metadata: {
          messageId: uuidv4(),
          model: 'system'
        }
      }]
    });

    await chatSession.save();

    res.status(201).json({
      sessionId: sessionId,
      session: chatSession
    });
  } catch (error) {
    console.error('Create chat session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message in chat session
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Find the chat session
    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
      user: userId,
      isActive: true
    });

    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      metadata: {
        messageId: uuidv4()
      }
    };

    chatSession.messages.push(userMessage);

    // Prepare context for AI
    const context = {
      userRole: chatSession.context.userRole,
      sessionType: chatSession.context.sessionType,
      recentMessages: chatSession.messages.slice(-6) // Last 6 messages for context
    };

    // Generate AI response
    const aiResponse = await geminiAI.generateResponse(message, context);

    // Add AI response
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      metadata: {
        messageId: uuidv4(),
        ...aiResponse.metadata
      }
    };

    chatSession.messages.push(assistantMessage);
    chatSession.lastActivity = new Date();
    
    await chatSession.save();

    res.json({
      userMessage: userMessage,
      assistantMessage: assistantMessage,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get chat session history
exports.getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
      user: userId
    }).populate('user', 'name email role');

    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ session: chatSession });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's chat sessions
exports.getUserChatSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, active = true } = req.query;

    const query = { user: userId };
    if (active !== 'all') {
      query.isActive = active === 'true';
    }

    const chatSessions = await ChatSession.find(query)
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId context messages.role messages.timestamp lastActivity isActive')
      .lean();

    // Add session previews
    const sessionsWithPreview = chatSessions.map(session => ({
      ...session,
      messageCount: session.messages.length,
      lastMessage: session.messages[session.messages.length - 1],
      preview: session.messages.length > 1 ? 
        session.messages[session.messages.length - 1].content.substring(0, 100) + '...' : 
        'New conversation'
    }));

    const total = await ChatSession.countDocuments(query);

    res.json({
      sessions: sessionsWithPreview,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user chat sessions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Close chat session
exports.closeChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const chatSession = await ChatSession.findOne({
      sessionId: sessionId,
      user: userId
    });

    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Generate session summary
    const summary = await geminiAI.generateSessionSummary(chatSession.messages);

    chatSession.isActive = false;
    chatSession.context.sessionSummary = summary;
    await chatSession.save();

    res.json({
      message: 'Chat session closed successfully',
      summary: summary
    });
  } catch (error) {
    console.error('Close chat session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get AI health suggestions based on user role
exports.getHealthSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    let suggestions = [];

    if (user.role === 'patient') {
      suggestions = [
        "What are the symptoms of common cold?",
        "How to manage stress and anxiety?",
        "When should I schedule a regular check-up?",
        "What are healthy lifestyle habits?",
        "How to prepare for a doctor's appointment?"
      ];
    } else if (user.role === 'doctor') {
      suggestions = [
        "Latest treatment guidelines for hypertension",
        "How to explain complex medical conditions to patients?",
        "Best practices for patient communication",
        "Managing patient appointment schedules",
        "Staying updated with medical research"
      ];
    } else {
      suggestions = [
        "How can I help patients navigate the hospital?",
        "What information should I collect during registration?",
        "How to handle emergency situations?",
        "Best practices for patient care",
        "Understanding hospital procedures"
      ];
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Get health suggestions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
