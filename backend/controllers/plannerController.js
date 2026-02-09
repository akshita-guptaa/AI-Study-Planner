const {
  generateStudyPlan,
  generateRecommendations,
  rescheduleMissedTasks,
} = require('../utils/aiPlanner');
const StudyTask = require('../models/StudyTask');

// @desc    Generate AI study plan
// @route   POST /api/planner/generate
// @access  Private
const generatePlan = async (req, res) => {
  try {
    const { daysToGenerate, dailyHours } = req.body;

    const result = await generateStudyPlan(req.user._id, {
      daysToGenerate: daysToGenerate || 7,
      dailyHours: dailyHours || req.user.dailyStudyHours,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Save generated tasks to database
    const allTasks = result.dailyPlans.flatMap((day) => day.tasks);
    
    // Delete existing future AI-generated tasks
    await StudyTask.deleteMany({
      userId: req.user._id,
      aiGenerated: true,
      plannedDate: { $gte: new Date() },
    });

    // Insert new tasks
    const createdTasks = await StudyTask.insertMany(allTasks);

    res.status(201).json({
      message: 'Study plan generated successfully',
      dailyPlans: result.dailyPlans,
      totalTasks: createdTasks.length,
      metadata: result.metadata,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks for a specific date range
// @route   GET /api/planner/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (startDate && endDate) {
      query.plannedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const tasks = await StudyTask.find(query)
      .populate('subjectId', 'subjectName color')
      .populate('topicId', 'topicName')
      .sort({ plannedDate: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/planner/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await StudyTask.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = new Date();
      
      // Update topic progress
      if (task.topicId) {
        const Topic = require('../models/Topic');
        const topic = await Topic.findById(task.topicId);
        
        if (topic) {
          topic.actualHours += task.actualHours || task.plannedHours;
          
          // Mark topic as completed if actual hours >= estimated
          if (topic.actualHours >= topic.estimatedHours) {
            topic.completed = true;
            topic.completedAt = new Date();
          }
          
          await topic.save();
        }
      }
    }

    const updatedTask = await StudyTask.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('subjectId', 'subjectName color')
      .populate('topicId', 'topicName');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI recommendations
// @route   GET /api/planner/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.user._id);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule missed tasks
// @route   POST /api/planner/reschedule
// @access  Private
const rescheduleTasks = async (req, res) => {
  try {
    const result = await rescheduleMissedTasks(req.user._id);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      message: `Successfully rescheduled ${result.missedCount} tasks`,
      missedCount: result.missedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePlan,
  getTasks,
  updateTask,
  getRecommendations,
  rescheduleTasks,
};