const express = require('express');
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getSubjects)
  .post(protect, createSubject);

router.route('/:id')
  .get(protect, getSubjectById)
  .put(protect, updateSubject)
  .delete(protect, deleteSubject);

router.route('/:id/topics')
  .get(protect, getSubjectTopics)
  .post(protect, createTopic);

router.route('/:subjectId/topics/:topicId')
  .put(protect, updateTopic)
  .delete(protect, deleteTopic);

module.exports = router;