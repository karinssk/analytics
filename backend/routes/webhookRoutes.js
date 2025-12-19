const express = require('express');
const router = express.Router();
const lineController = require('../controllers/lineController');
const facebookController = require('../controllers/facebookController');

// LINE
router.post('/line', lineController.handleLineWebhook);
// Backward compatibility for existing webhook endpoint if needed, or just redirect
// The original code used /webhook for LINE. 
// If the user's LINE config points to /webhook, we should keep it or ask them to change. 
// For now, let's map /webhook (legacy) to LINE as well, or just direct /line.
// But the user asked to split server.js. Let's assume explicit paths now.
// However, to avoid breaking existing LINE setup, we can alias /webhook to LINE in app.js if needed.
// Here we define the specialized routes.

router.get('/facebook', facebookController.verifyWebhook);
router.post('/facebook', facebookController.handleWebhook);

module.exports = router;
