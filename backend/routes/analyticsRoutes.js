const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get today's metrics
router.get('/pages/:pageId/metrics/today', analyticsController.getMetricsToday);

// Get metrics for date range
router.get('/pages/:pageId/metrics/range', analyticsController.getMetricsRange);

// Get new PSIDs (first-time contacts) for a date range
router.get('/pages/:pageId/new-psids', analyticsController.getNewPsids);

// Sync metrics from Meta (video views, engagement)
router.post('/pages/:pageId/metrics/sync', analyticsController.syncMetrics);

module.exports = router;
