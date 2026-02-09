const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');
const { sortSubjectsByPriority } = require('./priorityCalculator');
const { allocateStudyTime, distributeHoursToTopics } = require('./timeAllocator');

/**
 * Main AI Planner Function
 * Generates optimized study plan for a user
 */
const generateStudyPlan = async (userId, options = {}) => {
  try {
    const {
      targetDate = new Date(),
      daysToGenerate = 7,
      dailyHours = 4,
    } = options;

    // 1. Get all active subjects for the user
    const subjects = await Subject.find({
      userId,
      isActive: true,
    });

    if (subjects.length === 0) {
      return {
        success: false,
        message: 'No active subjects found',
      };
    }

    // 2. Get pending topics for each subject
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (subject) => {
        const allTopics = await Topic.find({ subjectId: subject._id });
        const pendingTopics = allTopics.filter((topic) => !topic.completed);

        return {
          subject,
          allTopics,
          pendingTopics,
        };
      })
    );

    // Filter subjects that have pending work
    const subjectsWithPendingWork = subjectsWithTopics.filter(
      (item) => item.pendingTopics.length > 0
    );

    if (subjectsWithPendingWork.length === 0) {
      return {
        success: false,
        message: 'No pending topics found',
      };
    }

    // 3. Calculate priority scores and sort
    const prioritizedSubjects = sortSubjectsByPriority(subjectsWithPendingWork);

    // 4. Generate daily plans
    const dailyPlans = [];

    for (let day = 0; day < daysToGenerate; day++) {
      const planDate = new Date(targetDate);
      planDate.setDate(planDate.getDate() + day);

      // Allocate time for this day
      const allocations = allocateStudyTime(prioritizedSubjects, dailyHours);

      // Create tasks for each allocation
      const dayTasks = [];

      for (const allocation of allocations) {
        // Distribute hours to specific topics
        const topicAllocations = distributeHoursToTopics(
          allocation.allocatedHours,
          allocation.pendingTopics
        );

        for (const topicAlloc of topicAllocations) {
          const task = {
            userId,
            subjectId: allocation.subject._id,
            topicId: topicAlloc.topicId,
            taskName: `Study ${topicAlloc.topicName}`,
            plannedDate: planDate,
            plannedHours: topicAlloc.allocatedHours,
            status: 'pending',
            priority: allocation.priorityScore,
            aiGenerated: true,
          };

          dayTasks.push(task);
        }
      }

      dailyPlans.push({
        date: planDate,
        tasks: dayTasks,
        totalHours: allocations.reduce((sum, a) => sum + a.allocatedHours, 0),
      });
    }

    return {
      success: true,
      dailyPlans,
      metadata: {
        totalSubjects: prioritizedSubjects.length,
        generatedDays: daysToGenerate,
        dailyHours,
      },
    };
  } catch (error) {
    console.error('AI Planner Error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Generate AI recommendations for a user
 */
const generateRecommendations = async (userId) => {
  try {
    const subjects = await Subject.find({ userId, isActive: true });
    const recommendations = [];

    for (const subject of subjects) {
      const topics = await Topic.find({ subjectId: subject._id });
      const pendingTopics = topics.filter((t) => !t.completed);
      
      const now = new Date();
      const examDate = new Date(subject.examDate);
      const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

      const totalPendingHours = pendingTopics.reduce(
        (sum, t) => sum + (t.estimatedHours - t.actualHours),
        0
      );

      // Generate contextual recommendations
      if (daysLeft <= 7 && totalPendingHours > daysLeft * 3) {
        recommendations.push({
          type: 'warning',
          subject: subject.subjectName,
          message: `⚠️ ${subject.subjectName}: Exam in ${daysLeft} days with ${totalPendingHours.toFixed(1)} hours pending. Consider increasing daily study hours.`,
          priority: 'high',
        });
      }

      if (daysLeft <= 3) {
        recommendations.push({
          type: 'urgent',
          subject: subject.subjectName,
          message: `🔥 ${subject.subjectName}: Exam in ${daysLeft} days! Focus on revision and practice.`,
          priority: 'critical',
        });
      }

      if (subject.difficulty === 'hard' && pendingTopics.length > 5) {
        recommendations.push({
          type: 'tip',
          subject: subject.subjectName,
          message: `💡 ${subject.subjectName}: Break down complex topics into smaller chunks for better retention.`,
          priority: 'medium',
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Recommendations Error:', error);
    return [];
  }
};

/**
 * Auto-reschedule missed tasks
 */
const rescheduleMissedTasks = async (userId) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find all missed tasks (planned for past, status still pending)
    const missedTasks = await StudyTask.find({
      userId,
      plannedDate: { $lt: now },
      status: 'pending',
    });

    // Update status to missed
    await StudyTask.updateMany(
      {
        userId,
        plannedDate: { $lt: now },
        status: 'pending',
      },
      { status: 'missed' }
    );

    // Redistribute missed tasks to upcoming days
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let i = 0; i < missedTasks.length; i++) {
      const task = missedTasks[i];
      const newDate = new Date(tomorrow);
      newDate.setDate(newDate.getDate() + Math.floor(i / 3)); // Spread across days

      await StudyTask.create({
        userId: task.userId,
        subjectId: task.subjectId,
        topicId: task.topicId,
        taskName: `[Rescheduled] ${task.taskName}`,
        plannedDate: newDate,
        plannedHours: task.plannedHours,
        status: 'pending',
        priority: task.priority + 10, // Increase priority
        aiGenerated: true,
      });
    }

    return {
      success: true,
      missedCount: missedTasks.length,
    };
  } catch (error) {
    console.error('Reschedule Error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = {
  generateStudyPlan,
  generateRecommendations,
  rescheduleMissedTasks,
};