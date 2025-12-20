const prisma = require('../config/prisma');
const { extractUserInfo } = require('../services/extractionService');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = config.channelAccessToken ? new line.Client(config) : null;

async function getLineDisplayName(userId) {
    try {
        const res = await axios.get(
            `https://api.line.me/v2/bot/profile/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                },
            }
        );
        return res.data.displayName;
    } catch (error) {
        console.error('Error fetching LINE profile:', error.message);
        return 'Unknown User';
    }
}

async function handleLineWebhook(req, res) {
    try {
        const signature = req.headers['x-line-signature'];
        if (!line.validateSignature(req.rawBody, config.channelSecret, signature)) {
            console.error('Invalid LINE signature');
            return res.status(401).send('Invalid signature');
        }

        const events = req.body.events;
        if (!events || events.length === 0) {
            return res.status(200).send('OK');
        }

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userId = event.source.userId;
                const text = event.message.text;
                const lineId = userId; // Use LINE userId as unique identifier

                // 1. Find or create user
                let user = await prisma.user.findUnique({
                    where: { lineId: lineId },
                });

                if (!user) {
                    const displayName = await getLineDisplayName(userId);
                    user = await prisma.user.create({
                        data: {
                            lineId: lineId,
                            name: displayName,
                        },
                    });
                } else if (user.name === 'Unknown User') {
                     // Briefly try to update name if it was unknown (optional improvement)
                     const displayName = await getLineDisplayName(userId);
                     if (displayName !== 'Unknown User') {
                         user = await prisma.user.update({
                             where: { id: user.id },
                             data: { name: displayName }
                         });
                     }
                }

                // 2. Extract info and update user if found
                const extracted = extractUserInfo(text);
                if (extracted.phone || extracted.address) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: extracted,
                    });
                }

                // 3. Find or create active chat session
                let chat = await prisma.chat.findFirst({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (!chat) {
                    chat = await prisma.chat.create({
                        data: {
                            userId: user.id,
                            messages: [] // Init empty array
                        },
                    });
                }

                // 4. Store message in JSON array
                const newMessage = {
                    sender: 'user',
                    content: text,
                    createdAt: new Date().toISOString()
                };

                // Get current messages (it might be null or object, ensure array)
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
                console.log(event.body)
                console.log(`Processed message from LINE ${lineId}: ${text}`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing LINE webhook:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    handleLineWebhook
};
