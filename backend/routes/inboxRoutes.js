const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inboxController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get conversations across all pages
router.get('/conversations', inboxController.getAllConversations);

// Get conversations for a page
router.get('/pages/:pageId/conversations', inboxController.getConversations);

// Get messages for a conversation
router.get('/conversations/:id/messages', inboxController.getMessages);

// Send a message
router.post('/conversations/:id/send', inboxController.sendMessage);

module.exports = router;
