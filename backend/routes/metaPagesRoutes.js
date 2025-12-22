const express = require('express');
const router = express.Router();
const metaAuthController = require('../controllers/metaAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes - require authentication
router.get('/pages', authMiddleware, metaAuthController.getPages);
router.post('/pages/:pageId/connect', authMiddleware, metaAuthController.connectPage);
router.delete('/pages/:pageId/disconnect', authMiddleware, metaAuthController.disconnectPage);

module.exports = router;
