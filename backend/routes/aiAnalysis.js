const express = require('express');
const router = express.Router();
const { analyzeSyllabus, estimateTopicTime } = require('../controllers/aiAnalysisController');
const { protect } = require('../middleware/authMiddleware');

// Analyze entire syllabus
router.post('/analyze-syllabus', protect, analyzeSyllabus);

// Estimate time for single topic
router.post('/estimate-topic', protect, estimateTopicTime);

module.exports = router;
