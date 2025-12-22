const prisma = require('../config/prisma');
const axios = require('axios');

const WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your-verify-token';

// Verify webhook (GET)
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('META WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
}

// Handle incoming messages (POST)
async function handleWebhook(req, res) {
  const body = req.body;

  console.log('Meta Webhook received:', JSON.stringify(body, null, 2));

  // Must respond quickly to Meta webhook
  res.status(200).send('EVENT_RECEIVED');

  // Process asynchronously
  if (body.object === 'page') {
    try {
      for (const entry of body.entry) {
        const pageId = entry.id;

        // Find the page in our database
        const page = await prisma.page.findUnique({
          where: { pageId: pageId }
        });

        if (!page) {
          console.log(`Page ${pageId} not found in database`);
          continue;
        }

        // Process messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await processMessagingEvent(page, event);
          }
        }
      }
    } catch (error) {
      console.error('Error processing Meta webhook:', error);
    }
  }
}

// Process individual messaging event
async function processMessagingEvent(page, event) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

  // Skip if this is from the page itself (outbound confirmation)
  if (senderId === page.pageId) {
    return;
  }

  // Handle regular message
  if (event.message && event.message.text) {
    const text = event.message.text;
    const messageId = event.message.mid;

    // Upsert conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        pageId_psid: {
          pageId: page.id,
          psid: senderId
        }
      },
      update: {
        lastCustomerMessageAt: timestamp,
        lastMessageAt: timestamp,
        lastMessagePreview: text.substring(0, 100)
      },
      create: {
        pageId: page.id,
        psid: senderId,
        lastCustomerMessageAt: timestamp,
        lastMessageAt: timestamp,
        lastMessagePreview: text.substring(0, 100)
      }
    });

    // Try to get customer name (might fail if token issues)
    if (!conversation.customerName) {
      try {
        const pageToken = await prisma.pageToken.findUnique({
          where: { pageId: page.id }
        });

        if (pageToken) {
          const profileResponse = await axios.get(
            `https://graph.facebook.com/v18.0/${senderId}`,
            {
              params: {
                access_token: pageToken.accessToken,
                fields: 'first_name,last_name,name'
              }
            }
          );

          const name = profileResponse.data.name ||
            `${profileResponse.data.first_name || ''} ${profileResponse.data.last_name || ''}`.trim();

          if (name) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { customerName: name }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching customer profile:', error.message);
      }
    }

    // Save inbound message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        content: text,
        messageId: messageId,
        timestamp: timestamp
      }
    });

    console.log(`Saved inbound message from ${senderId} to page ${page.pageId}`);

    // Update daily metrics
    await updateDailyMetrics(page.id, timestamp, senderId);
  }

  // Handle postback (button clicks)
  if (event.postback) {
    console.log('Postback received:', event.postback);
    // Can process postbacks similarly if needed
  }
}

// Update daily metrics
async function updateDailyMetrics(pageId, timestamp, senderId) {
  const dateOnly = new Date(timestamp);
  dateOnly.setHours(0, 0, 0, 0);

  try {
    // Upsert daily metric
    await prisma.dailyMetric.upsert({
      where: {
        pageId_date: {
          pageId: pageId,
          date: dateOnly
        }
      },
      update: {
        messagesCount: { increment: 1 }
        // Note: We'll calculate uniqueSenders on read for accuracy
      },
      create: {
        pageId: pageId,
        date: dateOnly,
        messagesCount: 1,
        uniqueSenders: 1
      }
    });
  } catch (error) {
    console.error('Error updating daily metrics:', error);
  }
}

module.exports = {
  verifyWebhook,
  handleWebhook
};
