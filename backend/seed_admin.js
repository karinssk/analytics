const bcrypt = require('bcryptjs');
const prisma = require('./config/prisma');

async function seedAdmin() {
    const email = 'admin@gmail.com';
    const password = '258369';
    const name = 'Admin';

    try {
        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            console.log('Admin already exists:', email);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        console.log('✅ Default admin created:');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   ID:', admin.id);
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
