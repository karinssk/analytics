const express = require('express');
const router = express.Router();
const metaAuthController = require('../controllers/metaAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes - OAuth flow
router.get('/meta', metaAuthController.redirectToMeta);
router.get('/meta/callback', metaAuthController.handleCallback);

module.exports = router;
