const express = require('express');
const router = express.Router();
const lineController = require('../controllers/lineController');
const facebookController = require('../controllers/facebookController');
const metaWebhookController = require('../controllers/metaWebhookController');

// LINE
router.post('/line', lineController.handleLineWebhook);

// Legacy Facebook (original implementation)
router.get('/facebook', facebookController.verifyWebhook);
router.post('/facebook', facebookController.handleWebhook);

// New Meta Messenger webhook (for MVP)
router.get('/meta', metaWebhookController.verifyWebhook);
router.post('/meta', metaWebhookController.handleWebhook);

module.exports = router;

