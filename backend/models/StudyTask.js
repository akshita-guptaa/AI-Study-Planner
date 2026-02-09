const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    taskName: {
      type: String,
      required: true,
    },
    plannedDate: {
      type: Date,
      required: true,
    },
    plannedHours: {
      type: Number,
      required: true,
      min: 0.5,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'missed'],
      default: 'pending',
    },
    priority: {
      type: Number,
      default: 1,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
studyTaskSchema.index({ userId: 1, plannedDate: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);