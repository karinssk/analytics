const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function fixJson() {
    console.log('Checking for Chats with invalid messages...');
    
    // Attempt to find chats where messages might be empty string or null (if schema allows, though default is [])
    // Note: In strict MySQL JSON columns, you can't have empty string. 
    // But if it was created as TEXT or similar by mistake, or if it's MariaDB, it might happen.
    // We will use raw SQL to force update.
    
    try {
        const result = await prisma.$executeRaw`
            UPDATE Chat 
            SET messages = '[]' 
            WHERE messages IS NULL 
               OR CAST(messages AS CHAR) = '' 
               OR CAST(messages AS CHAR) = 'null';
        `;
        console.log(`Updated ${result} rows.`);
        
        // Verification fetch
        const chats = await prisma.chat.findMany();
        console.log('Current chats:', chats.length);
        console.log('First 5 chats:', JSON.stringify(chats.slice(0, 5), null, 2));

    } catch (e) {
        console.error('Error fixing JSON:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixJson();
