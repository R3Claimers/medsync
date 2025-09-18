const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create new chat session
router.post('/sessions', aiChatController.createChatSession);

// Get user's chat sessions
router.get('/sessions', aiChatController.getUserChatSessions);

// Get specific chat session
router.get('/sessions/:sessionId', aiChatController.getChatSession);

// Send message in chat session
router.post('/sessions/:sessionId/messages', aiChatController.sendMessage);

// Close chat session
router.put('/sessions/:sessionId/close', aiChatController.closeChatSession);

// Get health suggestions based on user role
router.get('/suggestions', aiChatController.getHealthSuggestions);

module.exports = router;
