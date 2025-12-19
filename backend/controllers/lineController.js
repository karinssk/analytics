const prisma = require('../config/prisma');
const { extractUserInfo } = require('../services/extractionService');

async function handleLineWebhook(req, res) {
    try {
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
                    user = await prisma.user.create({
                        data: {
                            lineId: lineId,
                            name: 'Unknown User',
                        },
                    });
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
                        },
                    });
                }

                // 4. Store message
                await prisma.message.create({
                    data: {
                        chatId: chat.id,
                        sender: 'user',
                        content: text,
                    },
                });

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
