const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(cors());
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4299;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock regex patterns for extraction
const PHONE_REGEX = /(\b0[689]\d{8}\b|\b0\d{2}-\d{3}-\d{4}\b)/; // Basic Thai phone regex example
const ADDRESS_KEYWORDS = ['address', 'street', 'road', 'district', 'subdistrict', 'province', 'zip', 'code'];

// Helper to extract info from text
function extractUserInfo(text) {
    const info = {};
    
    // Phone
    const phoneMatch = text.match(PHONE_REGEX);
    if (phoneMatch) {
        info.phone = phoneMatch[0];
    }

    // Address (very basic heuristic: if text contains address keywords and is long enough)
    // In a real app, this would use an NLP service or more complex logic.
    const lowerText = text.toLowerCase();
    const hasAddressKeyword = ADDRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
    if (hasAddressKeyword && text.length > 20) {
        info.address = text;
    }

    return info;
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
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
                            name: 'Unknown User', // Placeholder, can be updated if profile is fetched
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
                // For simplified logic, we might just put everything in one "Chat" per user, 
                // or create a new Chat if the last one is old. 
                // Let's assume one main Chat history for now or create a new 'session' if we wanted.
                // The requirement says "store all chat for each user" -> "chat = all conversation".
                // We'll create a single Chat entity for the user if it doesn't exist, or just append messages.
                // However, the schema allows multiple Chats. Let's create one default chat for the user if not exists.
                
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

                console.log(`Processed message from ${lineId}: ${text}`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                chats: {
                    include: {
                        messages: true
                    }
                }
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/', (req, res) => {
    res.send('LINE OA Chat Storage Server Running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
