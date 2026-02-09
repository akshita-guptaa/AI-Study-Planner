const express = require('express');
const {
  generatePlan,
  getTasks,
  updateTask,
  getRecommendations,
  rescheduleTasks,
} = require('../controllers/plannerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', protect, generatePlan);
router.get('/tasks', protect, getTasks);
router.put('/tasks/:id', protect, updateTask);
router.get('/recommendations', protect, getRecommendations);
router.post('/reschedule', protect, rescheduleTasks);

module.exports = router;