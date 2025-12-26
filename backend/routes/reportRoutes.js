const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/line', reportController.getLineReport);
router.post('/line/send-now', reportController.sendLineReportNow);
router.post('/line/schedule', reportController.scheduleLineReport);

module.exports = router;
