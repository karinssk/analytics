const prisma = require('../config/prisma');

async function getUsers(req, res) {
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
}

module.exports = {
    getUsers
};
