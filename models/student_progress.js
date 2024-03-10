const mongoose = require('mongoose');

const StudentProgressSchema = mongoose.Schema({
    student_id: String,
    term: String,
    class_name: String,
    session: [String],
    subjects: [{
        percentage: String,
        subject_name: String,
        current_week: {type: Number, default: 1}
    }],
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'students progress'});

const model = mongoose.model('StudentProgress', StudentProgressSchema);
module.exports = model;