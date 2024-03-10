const mongoose = require('mongoose');

const Worksheet = mongoose.Schema({
    category: String,
    topic: String,
    class_name: String,
    subject_name: String,
    term: String,
    session: String,
    week: Number,
    question: String,
    question_type: String,
    correct_answer: String,
    img_ids: [String],
    img_urls: [String],
    options: [String],
    answer_type: String,
    mark: Number,
    no: Number,
    is_deleted: { type: Boolean, default: false },
    timestamp: Number
}, { collection: 'worksheets' });

const model = mongoose.model('Worksheet', Worksheet);
module.exports = model;