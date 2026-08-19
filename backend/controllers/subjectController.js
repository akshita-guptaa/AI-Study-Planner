const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');

// @desc    Get all subjects for a user
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id, isActive: true })
      .sort({ examDate: 1 });

    // Get topic counts for each subject
    const subjectsWithStats = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await Topic.find({ subjectId: subject._id });
        const completedTopics = topics.filter(t => t.completed).length;
        
        return {
          ...subject.toObject(),
          totalTopics: topics.length,
          completedTopics,
          progressPercentage: topics.length > 0 
            ? Math.round((completedTopics / topics.length) * 100) 
            : 0
        };
      })
    );

    res.json(subjectsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const topics = await Topic.find({ subjectId: subject._id });

    res.json({
      ...subject.toObject(),
      topics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { subjectName, difficulty, priority, examDate, color } = req.body;

    if (!subjectName || !examDate) {
      return res.status(400).json({ 
        message: 'Please provide subject name and exam date' 
      });
    }

    const subject = await Subject.create({
      userId: req.user._id,
      subjectName,
      difficulty: difficulty || 'medium',
      priority: priority || 1,
      examDate,
      color: color || '#3b82f6',
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Soft delete the subject itself
    subject.isActive = false;
    await subject.save();

    // Cascade: remove all scheduled study tasks for this subject so they
    // disappear from the Schedule tab immediately, and delete its topics
    // too since a deleted subject's topics are no longer reachable anywhere.
    await StudyTask.deleteMany({ subjectId: subject._id, userId: req.user._id });
    await Topic.deleteMany({ subjectId: subject._id });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all topics for a subject
// @route   GET /api/subjects/:id/topics
// @access  Private
const getSubjectTopics = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const topics = await Topic.find({ subjectId: req.params.id })
      .sort({ createdAt: -1 });

    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create topic for subject
// @route   POST /api/subjects/:id/topics
// @access  Private
const createTopic = async (req, res) => {
  try {
    const { topicName, estimatedHours, notes } = req.body;

    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (!topicName || !estimatedHours) {
      return res.status(400).json({ 
        message: 'Please provide topic name and estimated hours' 
      });
    }

    const topic = await Topic.create({
      subjectId: req.params.id,
      topicName,
      estimatedHours,
      notes: notes || '',
    });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update topic
// @route   PUT /api/subjects/:subjectId/topics/:topicId
// @access  Private
const updateTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Verify ownership through subject
    const subject = await Subject.findOne({
      _id: topic.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.completed && !topic.completed) {
      req.body.completedAt = new Date();
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.topicId,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedTopic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete topic
// @route   DELETE /api/subjects/:subjectId/topics/:topicId
// @access  Private
const deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const subject = await Subject.findOne({
      _id: topic.subjectId,
      userId: req.user._id,
    });

    if (!subject) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await topic.deleteOne();

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectTopics,
  createTopic,
  updateTopic,
  deleteTopic,
};
