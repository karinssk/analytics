const prisma = require('../config/prisma');
const axios = require('axios');

// 24-hour window in milliseconds
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Check if reply is allowed based on 24h rule
function isReplyAllowed(lastCustomerMessageAt) {
  if (!lastCustomerMessageAt) return false;
  const now = new Date();
  const lastMessage = new Date(lastCustomerMessageAt);
  return (now - lastMessage) <= TWENTY_FOUR_HOURS_MS;
}

// Get time remaining in 24h window
function getTimeRemaining(lastCustomerMessageAt) {
  if (!lastCustomerMessageAt) return null;
  const now = new Date();
  const lastMessage = new Date(lastCustomerMessageAt);
  const elapsed = now - lastMessage;
  const remaining = TWENTY_FOUR_HOURS_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

// Get conversations for a page
async function getConversations(req, res) {
  const { pageId } = req.params;

  try {
    const page = await prisma.page.findUnique({
      where: { pageId: pageId }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const conversations = await prisma.conversation.findMany({
      where: { pageId: page.id },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        page: {
          select: { name: true, pageId: true }
        }
      }
    });

    // Add computed fields
    const conversationsWithStatus = conversations.map(conv => ({
      id: conv.id,
      psid: conv.psid,
      pageName: conv.page?.name || 'Unknown Page',
      pagePid: conv.page?.pageId || '',
      customerName: conv.customerName || 'Unknown User',
      lastMessageAt: conv.lastMessageAt,
      lastMessagePreview: conv.lastMessagePreview,
      lastCustomerMessageAt: conv.lastCustomerMessageAt,
      isReplyAllowed: isReplyAllowed(conv.lastCustomerMessageAt),
      timeRemaining: getTimeRemaining(conv.lastCustomerMessageAt)
    }));

    res.json({ conversations: conversationsWithStatus });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// Get conversations across all pages available to the admin
async function getAllConversations(req, res) {
  try {
    const adminWorkspaces = await prisma.adminWorkspace.findMany({
      where: { adminId: req.adminId },
      select: { workspaceId: true }
    });
    const workspaceIds = adminWorkspaces.map(w => w.workspaceId);

    const pages = await prisma.page.findMany({
      where: workspaceIds.length ? { workspaceId: { in: workspaceIds } } : {},
      select: { id: true, name: true, pageId: true }
    });

    const pageIdMap = new Map(pages.map(p => [p.id, p]));

    const conversations = await prisma.conversation.findMany({
      where: {
        pageId: { in: pages.map(p => p.id) }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: { page: { select: { name: true, pageId: true } } }
    });

    const conversationsWithStatus = conversations.map(conv => ({
      id: conv.id,
      psid: conv.psid,
      pageName: conv.page?.name || pageIdMap.get(conv.pageId)?.name || 'Unknown Page',
      pagePid: conv.page?.pageId || pageIdMap.get(conv.pageId)?.pageId || '',
      customerName: conv.customerName || 'Unknown User',
      lastMessageAt: conv.lastMessageAt,
      lastMessagePreview: conv.lastMessagePreview,
      lastCustomerMessageAt: conv.lastCustomerMessageAt,
      isReplyAllowed: isReplyAllowed(conv.lastCustomerMessageAt),
      timeRemaining: getTimeRemaining(conv.lastCustomerMessageAt)
    }));

    res.json({ conversations: conversationsWithStatus });
  } catch (error) {
    console.error('Error fetching all conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// Get messages for a conversation
async function getMessages(req, res) {
  const { id } = req.params;
  const { limit = 50, before } = req.query;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const whereClause = { conversationId: conversation.id };
    if (before) {
      whereClause.timestamp = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit)
    });

    res.json({
      conversation: {
        id: conversation.id,
        customerName: conversation.customerName,
        isReplyAllowed: isReplyAllowed(conversation.lastCustomerMessageAt),
        timeRemaining: getTimeRemaining(conversation.lastCustomerMessageAt),
        lastCustomerMessageAt: conversation.lastCustomerMessageAt
      },
      messages: messages.map(msg => ({
        id: msg.id,
        direction: msg.direction,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// Send a message
async function sendMessage(req, res) {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: parseInt(id) },
      include: {
        page: {
          include: { pageToken: true }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check 24h window
    if (!isReplyAllowed(conversation.lastCustomerMessageAt)) {
      return res.status(403).json({
        error: 'Cannot send message',
        reason: '24h_window_expired',
        message: 'The 24-hour messaging window has expired. Waiting for customer to send a new message.'
      });
    }

    const pageToken = conversation.page.pageToken?.accessToken;
    if (!pageToken) {
      return res.status(500).json({ error: 'Page token not found' });
    }

    // Send message via Graph API
    const sendResponse = await axios.post(
      'https://graph.facebook.com/v18.0/me/messages',
      {
        recipient: { id: conversation.psid },
        message: { text: message.trim() },
        messaging_type: 'RESPONSE'
      },
      {
        params: { access_token: pageToken }
      }
    );

    const messageId = sendResponse.data.message_id;
    const timestamp = new Date();

    // Save outbound message
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        content: message.trim(),
        messageId: messageId,
        timestamp: timestamp
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: timestamp,
        lastMessagePreview: message.trim().substring(0, 100)
      }
    });

    res.json({
      success: true,
      message: {
        id: savedMessage.id,
        direction: 'OUTBOUND',
        content: savedMessage.content,
        timestamp: savedMessage.timestamp
      }
    });

  } catch (error) {
    console.error('Error sending message:', error.response?.data || error);

    if (error.response?.data?.error?.code === 10) {
      return res.status(403).json({
        error: 'Cannot send message',
        reason: 'permission_denied',
        message: 'Permission denied by Facebook. The 24-hour window may have expired.'
      });
    }

    res.status(500).json({ error: 'Failed to send message' });
  }
}

module.exports = {
  getConversations,
  getAllConversations,
  getMessages,
  sendMessage
};
