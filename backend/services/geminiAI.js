const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Medical context and safety guidelines
    this.systemPrompt = `You are MedSync AI, a healthcare assistant integrated into a hospital management system. You provide helpful, accurate, and safe medical information while adhering to these guidelines:

ROLE & CAPABILITIES:
- Provide general health information and wellness guidance
- Help with understanding medical conditions, symptoms, and treatments
- Assist with appointment scheduling and hospital navigation
- Answer questions about medications (general information only)
- Provide first aid and emergency guidance when appropriate

SAFETY GUIDELINES:
- NEVER provide specific medical diagnoses
- ALWAYS recommend consulting healthcare professionals for serious symptoms
- Do not prescribe medications or dosages
- Clearly distinguish between emergency and non-emergency situations
- Redirect users to emergency services (911) for life-threatening situations

RESPONSE STYLE:
- Be empathetic, professional, and supportive
- Use clear, accessible language
- Provide actionable guidance when appropriate
- Include disclaimers about consulting healthcare professionals
- Be concise but comprehensive

HOSPITAL CONTEXT:
- You are integrated into MedSync hospital management system
- You can help users navigate hospital services
- You understand various user roles: patients, doctors, staff
- You promote the hospital's services appropriately

Remember: You provide general information and guidance, not medical diagnosis or treatment.`;
  }

  async generateResponse(userMessage, context = {}) {
    try {
      if (!this.model) {
        return this.getFallbackResponse(userMessage);
      }

      // Build conversation context
      const contextualPrompt = this.buildContextualPrompt(userMessage, context);
      
      const startTime = Date.now();
      const result = await this.model.generateContent(contextualPrompt);
      const responseTime = Date.now() - startTime;
      
      const response = result.response;
      const text = response.text();

      return {
        content: text,
        metadata: {
          model: 'gemini-1.5-flash',
          tokensUsed: this.estimateTokens(userMessage + text),
          responseTime: responseTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  buildContextualPrompt(userMessage, context) {
    let prompt = this.systemPrompt + '\n\n';
    
    // Add user context
    if (context.userRole) {
      prompt += `USER ROLE: ${context.userRole}\n`;
    }
    
    if (context.sessionType) {
      prompt += `SESSION TYPE: ${context.sessionType}\n`;
    }
    
    // Add conversation history context
    if (context.recentMessages && context.recentMessages.length > 0) {
      prompt += '\nRECENT CONVERSATION:\n';
      context.recentMessages.forEach(msg => {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }
    
    prompt += `\nCURRENT USER MESSAGE: ${userMessage}\n\n`;
    prompt += 'Please provide a helpful, safe, and appropriate response:';
    
    return prompt;
  }

  getFallbackResponse(userMessage) {
    const fallbackResponses = {
      symptoms: "I understand you're concerned about symptoms. While I can provide general health information, it's important to consult with a healthcare professional for proper evaluation of your symptoms. If you're experiencing severe symptoms, please seek immediate medical attention.",
      
      medication: "For questions about medications, I recommend speaking with your doctor or pharmacist who can provide personalized guidance based on your medical history and current medications.",
      
      emergency: "If this is a medical emergency, please call 911 or go to your nearest emergency room immediately. For urgent but non-emergency concerns, consider calling your doctor or visiting an urgent care center.",
      
      appointment: "I can help you understand our appointment process. You can book appointments through our MedSync system by selecting your preferred doctor and available time slot. Would you like me to guide you through the process?",
      
      general: "I'm here to help with health-related questions and hospital navigation. While I provide general information, please remember that this doesn't replace professional medical advice. Is there a specific area I can assist you with today?"
    };

    // Simple keyword matching for fallback
    const message = userMessage.toLowerCase();
    if (message.includes('symptom') || message.includes('pain') || message.includes('sick')) {
      return { content: fallbackResponses.symptoms, metadata: { isFallback: true } };
    }
    if (message.includes('medication') || message.includes('medicine') || message.includes('drug')) {
      return { content: fallbackResponses.medication, metadata: { isFallback: true } };
    }
    if (message.includes('emergency') || message.includes('urgent') || message.includes('911')) {
      return { content: fallbackResponses.emergency, metadata: { isFallback: true } };
    }
    if (message.includes('appointment') || message.includes('schedule') || message.includes('book')) {
      return { content: fallbackResponses.appointment, metadata: { isFallback: true } };
    }
    
    return { content: fallbackResponses.general, metadata: { isFallback: true } };
  }

  estimateTokens(text) {
    // Rough token estimation (1 token ≈ 4 characters for English)
    return Math.ceil(text.length / 4);
  }

  async generateSessionSummary(messages) {
    try {
      if (!this.model || messages.length === 0) {
        return "Session summary not available.";
      }

      const conversationText = messages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n');

      const summaryPrompt = `Please provide a brief, professional summary of this healthcare conversation. Focus on key topics discussed and any important guidance provided. Keep it concise and factual.

CONVERSATION:
${conversationText}

SUMMARY:`;

      const result = await this.model.generateContent(summaryPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Summary generation error:', error);
      return "Unable to generate session summary.";
    }
  }

  // Get contextual health tips based on user role
  getHealthTips(userRole) {
    const tips = {
      patient: [
        "Stay hydrated by drinking 8-10 glasses of water daily",
        "Regular exercise for 30 minutes can boost your immune system",
        "Maintain a balanced diet with fruits and vegetables",
        "Get 7-9 hours of quality sleep each night",
        "Don't skip regular health check-ups"
      ],
      doctor: [
        "Practice active listening with patients",
        "Stay updated with latest medical research",
        "Take regular breaks to prevent burnout",
        "Use evidence-based treatment approaches",
        "Maintain professional development through continuous learning"
      ],
      default: [
        "Wash hands frequently to prevent infections",
        "Maintain a healthy work-life balance",
        "Stay informed about health and safety protocols",
        "Support patients with empathy and professionalism",
        "Know when to escalate situations to medical professionals"
      ]
    };

    return tips[userRole] || tips.default;
  }
}

module.exports = new GeminiAIService();
