const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT token
function generateToken(adminId) {
    return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

// Register with email/password
async function register(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if email exists
        const existingAdmin = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null
            }
        });

        const token = generateToken(admin.id);

        res.status(201).json({
            message: 'Registration successful',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

// Login with email/password
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find admin
        const admin = await prisma.admin.findUnique({
            where: { email }
        });

        if (!admin || !admin.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(admin.id);

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

// Login with Google
async function googleLogin(req, res) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Find or create admin
        let admin = await prisma.admin.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            }
        });

        if (!admin) {
            // Create new admin
            admin = await prisma.admin.create({
                data: {
                    email,
                    googleId,
                    name
                }
            });
        } else if (!admin.googleId) {
            // Link Google account to existing email
            admin = await prisma.admin.update({
                where: { id: admin.id },
                data: { googleId }
            });
        }

        const token = generateToken(admin.id);

        res.json({
            message: 'Google login successful',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google login failed' });
    }
}

// Get current admin
async function me(req, res) {
    try {
        const admin = req.admin;
        
        res.json({
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Failed to get admin info' });
    }
}

module.exports = {
    register,
    login,
    googleLogin,
    me
};
