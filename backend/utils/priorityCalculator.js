/**
 * Calculate priority score for a subject based on multiple factors
 * Higher score = Higher priority
 */

const calculatePriorityScore = (subject, pendingTopics) => {
  const now = new Date();
  const examDate = new Date(subject.examDate);
  const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));

  // 1. Difficulty Weight (30%)
  const difficultyWeights = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  const difficultyScore = (difficultyWeights[subject.difficulty] || 2) / 3;

  // 2. Urgency Weight based on days left (40%)
  let urgencyScore = 0;
  if (daysLeft <= 3) {
    urgencyScore = 1.0; // Critical
  } else if (daysLeft <= 7) {
    urgencyScore = 0.8; // Very urgent
  } else if (daysLeft <= 14) {
    urgencyScore = 0.6; // Urgent
  } else if (daysLeft <= 30) {
    urgencyScore = 0.4; // Moderate
  } else {
    urgencyScore = 0.2; // Low urgency
  }

  // 3. Topic Load Weight (30%)
  const totalPendingHours = pendingTopics.reduce(
    (sum, topic) => sum + (topic.estimatedHours - topic.actualHours),
    0
  );
  const hoursPerDay = daysLeft > 0 ? totalPendingHours / daysLeft : totalPendingHours;
  const loadScore = Math.min(hoursPerDay / 4, 1); // Normalize to 0-1

  // Calculate final score (0-100)
  const finalScore = (
    difficultyScore * 30 +
    urgencyScore * 40 +
    loadScore * 30
  );

  return {
    score: Math.round(finalScore),
    breakdown: {
      difficulty: difficultyScore * 30,
      urgency: urgencyScore * 40,
      load: loadScore * 30,
    },
    metadata: {
      daysLeft,
      totalPendingHours,
      hoursPerDay: hoursPerDay.toFixed(2),
    },
  };
};

/**
 * Sort subjects by priority
 */
const sortSubjectsByPriority = (subjectsWithTopics) => {
  return subjectsWithTopics
    .map((item) => ({
      ...item,
      priorityData: calculatePriorityScore(item.subject, item.pendingTopics),
    }))
    .sort((a, b) => b.priorityData.score - a.priorityData.score);
};

module.exports = {
  calculatePriorityScore,
  sortSubjectsByPriority,
};