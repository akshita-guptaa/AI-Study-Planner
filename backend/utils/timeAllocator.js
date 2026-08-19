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

    const { subject, pendingTopics, unlockedTopics, priorityData } = subjectData;

    // Calculate proportional time based on priority
    const proportionalHours =
      (priorityData.score / totalPriorityWeight) * availableHours;

    // Required hours reflects TOTAL pending work (locked + unlocked) so
    // urgency/load stays accurate even when most topics are still gated
    // behind prerequisites.
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
      unlockedTopics,
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

  // Sort topics for scheduling:
  // 1. AI-assigned study order first — respects prerequisites (basics before advanced)
  // 2. Higher importance (1-5) breaks ties, so critical topics at the same
  //    prerequisite stage get scheduled before minor ones
  // 3. Shorter remaining time as final tiebreaker, for quick wins
  const sortedTopics = [...pendingTopics].sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    if (orderA !== orderB) return orderA - orderB;

    const importanceA = a.importance ?? 3;
    const importanceB = b.importance ?? 3;
    if (importanceA !== importanceB) return importanceB - importanceA;

    return (a.estimatedHours - a.actualHours) - (b.estimatedHours - b.actualHours);
  });

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

module.exports = {
  allocateStudyTime,
  distributeHoursToTopics,
};
