const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once_daily', 'twice_daily', 'three_times', 'custom']
  },
  schedule: [{
    time: {
      type: String,
      required: true
    },
    taken: {
      type: Boolean,
      default: false
    },
    takenAt: Date
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reminderLog: [{
    date: {
      type: Date,
      default: Date.now
    },
    time: String,
    status: {
      type: String,
      enum: ['taken', 'missed', 'skipped']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
medicineSchema.index({ userId: 1, isActive: 1 });
medicineSchema.index({ 'schedule.time': 1 });

module.exports = mongoose.model('Medicine', medicineSchema);