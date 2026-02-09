/**
 * Allocate available study hours across subjects intelligently
 */

const allocateStudyTime = (subjects, availableHours, preferences = {}) => {
  const {
    minSessionLength = 0.5, // Minimum 30 minutes
    maxSessionLength = 3, // Maximum 3 hours
    breakBetweenSubjects = 0.25, // 15-minute break
  } = preferences;

  let remainingHours = availableHours;
  const allocations = [];

  // Calculate total priority weight
  const totalPriorityWeight = subjects.reduce(
    (sum, s) => sum + s.priorityData.score,
    0
  );

  for (const subjectData of subjects) {
    if (remainingHours <= 0) break;

    const { subject, pendingTopics, priorityData } = subjectData;

    // Calculate proportional time based on priority
    const proportionalHours =
      (priorityData.score / totalPriorityWeight) * availableHours;

    // Calculate required hours for pending topics
    const requiredHours = pendingTopics.reduce(
      (sum, topic) => sum + (topic.estimatedHours - topic.actualHours),
      0
    );

    // Determine actual allocated hours
    let allocatedHours = Math.min(
      proportionalHours,
      requiredHours,
      remainingHours,
      maxSessionLength
    );

    // Ensure minimum session length or skip
    if (allocatedHours < minSessionLength && remainingHours >= minSessionLength) {
      allocatedHours = minSessionLength;
    } else if (allocatedHours < minSessionLength) {
      continue;
    }

    // Round to nearest 0.5 hours
    allocatedHours = Math.round(allocatedHours * 2) / 2;

    allocations.push({
      subject,
      allocatedHours,
      priorityScore: priorityData.score,
      pendingTopics,
      requiredHours,
    });

    remainingHours -= allocatedHours + breakBetweenSubjects;
  }

  return allocations;
};

/**
 * Distribute allocated hours among topics
 */
const distributeHoursToTopics = (allocatedHours, pendingTopics) => {
  const topicAllocations = [];
  let remainingHours = allocatedHours;

  // Sort topics by remaining hours (smaller topics first for completion)
  const sortedTopics = [...pendingTopics].sort(
    (a, b) =>
      a.estimatedHours - a.actualHours - (b.estimatedHours - b.actualHours)
  );

  for (const topic of sortedTopics) {
    if (remainingHours <= 0) break;

    const topicRemainingHours = topic.estimatedHours - topic.actualHours;
    const allocatedToTopic = Math.min(topicRemainingHours, remainingHours);

    if (allocatedToTopic > 0) {
      topicAllocations.push({
        topicId: topic._id,
        topicName: topic.topicName,
        allocatedHours: Math.round(allocatedToTopic * 2) / 2,
        remainingHours: topicRemainingHours,
      });

      remainingHours -= allocatedToTopic;
    }
  }

  return topicAllocations;
};

module.exports = {
  allocateStudyTime,
  distributeHoursToTopics,
};