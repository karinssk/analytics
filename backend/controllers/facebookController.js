const prisma = require('../config/prisma');
const { extractUserInfo } = require('../services/extractionService');

// Verify Webhook (GET)
function verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request if parameters are missing
    }
}

// Handle Messages (POST)
async function handleWebhook(req, res) {
    const body = req.body;
    
    console.log('Facebook Webhook received:', JSON.stringify(body, null, 2));

    // Handle Facebook Developer Console TEST format (field/value structure)
    if (body.field === 'messages' && body.value) {
        try {
            const value = body.value;
            const sender_psid = value.sender?.id;
            const text = value.message?.text;

            console.log('TEST MODE - Sender PSID:', sender_psid);
            console.log('TEST MODE - Message:', text);

            if (sender_psid && text) {
                const facebookId = sender_psid;

                // 1. Find or create user
                let user = await prisma.user.findUnique({
                    where: { facebookId: facebookId },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            facebookId: facebookId,
                            name: 'Facebook Test User',
                        },
                    });
                    console.log('Created new test user:', user.id);
                }

                // 2. Extract info
                const extracted = extractUserInfo(text);
                if (extracted.phone || extracted.address) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: extracted,
                    });
                }

                // 3. Find or create chat
                let chat = await prisma.chat.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (!chat) {
                    chat = await prisma.chat.create({
                        data: {
                            userId: user.id,
                            messages: []
                        },
                    });
                }

                // 4. Store message
                const newMessage = {
                    sender: 'user',
                    content: text,
                    createdAt: new Date().toISOString()
                };

                let currentMessages = chat.messages || [];
                if (!Array.isArray(currentMessages)) {
                    currentMessages = [];
                }
                currentMessages.push(newMessage);

                await prisma.chat.update({
                    where: { id: chat.id },
                    data: {
                        messages: currentMessages
                    }
                });

                console.log(`TEST MODE - Processed message from FB ${facebookId}: ${text}`);
            }

            return res.status(200).send('TEST_EVENT_RECEIVED');
        } catch (error) {
            console.error('Error processing Facebook TEST webhook:', error);
            return res.sendStatus(500);
        }
    }

    // Handle REAL Messenger webhook format (object/entry structure)
    if (body.object === 'page') {
        try {
            // Iterates over each entry - there may be multiple if batched
            for (const entry of body.entry) {
                // Gets the message. entry.messaging is an array, but usually contains only one message
                const webhook_event = entry.messaging[0];
                
                // Get the sender PSID
                const sender_psid = webhook_event.sender.id;
                console.log('Sender PSID: ' + sender_psid);

                // Check if it is a message and not a delivery confirmation or postback (for now handling only text)
                if (webhook_event.message && webhook_event.message.text) {
                    const text = webhook_event.message.text;
                    const facebookId = sender_psid;

                    // 1. Find or create user
                    let user = await prisma.user.findUnique({
                        where: { facebookId: facebookId },
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                facebookId: facebookId,
                                name: 'Facebook User',
                            },
                        });
                    }

                    // 2. Extract info
                    const extracted = extractUserInfo(text);
                    if (extracted.phone || extracted.address) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: extracted,
                        });
                    }

                    // 3. Find or create chat
                    let chat = await prisma.chat.findFirst({
                        where: { userId: user.id },
                        orderBy: { createdAt: 'desc' }
                    });

                    if (!chat) {
                        chat = await prisma.chat.create({
                            data: {
                                userId: user.id,
                                messages: []
                            },
                        });
                    }

                    // 4. Store message
                    const newMessage = {
                        sender: 'user',
                        content: text,
                        createdAt: new Date().toISOString()
                    };

                    let currentMessages = chat.messages || [];
                    if (!Array.isArray(currentMessages)) {
                        currentMessages = [];
                    }
                    currentMessages.push(newMessage);

                    await prisma.chat.update({
                        where: { id: chat.id },
                        data: {
                            messages: currentMessages
                        }
                    });

                    console.log(`Processed message from FB ${facebookId}: ${text}`);
                }
            }
            return res.status(200).send('EVENT_RECEIVED');
        } catch (error) {
            console.error('Error processing Facebook webhook:', error);
            return res.sendStatus(500);
        }
    }
    
    // Unknown format
    console.log('Unknown webhook format received');
    res.sendStatus(404);
}

module.exports = {
    verifyWebhook,
    handleWebhook
};
