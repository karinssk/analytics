const prisma = require('../config/prisma');

async function getUsers(req, res) {
    try {
        const users = await prisma.user.findMany({
            include: {
                chats: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}

// Aggregate LINE users and message counts with optional date filtering
async function getLineUserStats(req, res) {
    const { from, to } = req.query;

    try {
        const startDate = from ? new Date(from) : null;
        const endDate = to ? new Date(to) : null;
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        const chats = await prisma.chat.findMany({
            where: {
                user: { lineId: { not: null } }
            },
            include: { user: true }
        });

        const usersMap = new Map();
        let totalMessages = 0;

        for (const chat of chats) {
            const lineId = chat.user?.lineId;
            if (!lineId) continue;

            const messages = Array.isArray(chat.messages) ? chat.messages : [];

            const filteredMessages = messages.filter((msg) => {
                const ts = msg?.createdAt ? new Date(msg.createdAt) : null;
                if (!ts || isNaN(ts.getTime())) return false;
                if (startDate && ts < startDate) return false;
                if (endDate && ts > endDate) return false;
                return true;
            });

            if (!usersMap.has(lineId)) {
                usersMap.set(lineId, {
                    lineId,
                    name: chat.user?.name || 'Unknown User',
                    messageCount: 0
                });
            }

            const current = usersMap.get(lineId);
            current.messageCount += filteredMessages.length;
            totalMessages += filteredMessages.length;
        }

        const users = Array.from(usersMap.values()).sort((a, b) => b.messageCount - a.messageCount);

        res.json({
            totals: {
                users: users.length,
                messages: totalMessages
            },
            range: {
                start: startDate ? startDate.toISOString() : null,
                end: endDate ? endDate.toISOString() : null
            },
            users
        });
    } catch (error) {
        console.error('Error aggregating LINE users:', error);
        res.status(500).json({ error: 'Failed to fetch LINE user stats' });
    }
}

module.exports = {
    getUsers,
    getLineUserStats
};
