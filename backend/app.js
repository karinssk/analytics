const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const metaAuthRoutes = require('./routes/metaAuthRoutes');
const metaPagesRoutes = require('./routes/metaPagesRoutes');
const inboxRoutes = require('./routes/inboxRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const lineController = require('./controllers/lineController'); // For legacy route

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Meta Messenger MVP API Server Running');
});

// Routes
app.use('/webhook', webhookRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/auth', metaAuthRoutes);  // Meta OAuth routes (/auth/meta, /auth/meta/callback)
app.use('/meta', metaPagesRoutes);  // Meta pages routes (/meta/pages, etc.)
app.use('/inbox', inboxRoutes);     // Inbox routes (/inbox/pages/:pageId/conversations, etc.)
app.use('/analytics', analyticsRoutes); // Analytics routes (/analytics/pages/:pageId/metrics)

// Legacy support: map old /webhook POST to LINE handler directly if needed
app.post('/webhook', lineController.handleLineWebhook);

module.exports = app;

