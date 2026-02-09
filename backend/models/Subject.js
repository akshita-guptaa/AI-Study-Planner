const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    subjectName: {
      type: String,
      required: [true, 'Please provide a subject name'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    examDate: {
      type: Date,
      required: [true, 'Please provide exam date'],
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    totalTopics: {
      type: Number,
      default: 0,
    },
    completedTopics: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', subjectSchema);