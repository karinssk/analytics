const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const lineController = require('./controllers/lineController'); // For legacy route

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Chat Storage Server Running');
});

// Routes
app.use('/webhook', webhookRoutes);
app.use('/users', userRoutes);

// Legacy support: map old /webhook POST to LINE handler directly if needed
// The original server.js had app.post('/webhook', ...).
// If the LINE config expects /webhook, we should support it.
app.post('/webhook', lineController.handleLineWebhook);

module.exports = app;
