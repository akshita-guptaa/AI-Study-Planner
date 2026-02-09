const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },
    topicName: {
      type: String,
      required: [true, 'Please provide a topic name'],
      trim: true,
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Please provide estimated hours'],
      min: 0.5,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    resources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['video', 'article', 'book', 'other'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Topic', topicSchema);