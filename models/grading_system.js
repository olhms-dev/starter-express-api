const mongoose = require('mongoose');

const GradingSystemScehma = mongoose.Schema({
  doc_type: { type: String, default: 'grading system' },
  excellent: {
    grade: { type: String, default: 'A' },
    lte: { type: Number, default: 100 },
    gte: { type: Number, default: 70 }
  },
  very_good: {
    grade: { type: String, default: 'B' },
    lte: { type: Number, default: 69 },
    gte: { type: Number, default: 60 }
  },
  good: {
    grade: { type: String, default: 'C' },
    lte: { type: Number, default: 59 },
    gte: { type: Number, default: 50 }
  },
  fair: {
    grade: { type: String, default: 'D' },
    lte: { type: Number, default: 49 },
    gte: { type: Number, default: 40 }
  },
  fail: {
    grade: { type: String, default: 'F' },
    lte: { type: Number, default: 39 },
    gte: { type: Number, default: 0 }
  },
  timestamp: Number
}, { collection: 'grading system' });

const model = mongoose.model('GradingSystem', GradingSystemScehma);
module.exports = model;