const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  estimatedHours: { type: Number, default: 1 },
  actualHours: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  
  // ✅ NEW AI-POWERED FIELDS
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  prerequisites: [{ type: String }], // List of topic names that should be done first
  keyConcepts: [{ type: String }],   // Main concepts covered
  studyTips: { type: String },        // AI-generated study tips
  order: { type: Number },            // Suggested study order
  
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Topic', topicSchema);