const mongoose = require('mongoose');

const AnswerSheetSchema = mongoose.Schema({
    fullname: String,
    student_id: String,
    subject: String,
    class_name: String,
    ca: Number, // 1 or 2
    ca_date: String,
    ca_time: String,
    type: String, // exam, ca
    session: String,
    section: String, // a(objective) or b(theory)
    answers: [
        {
            question: String,
            question_type: String,
            img_id: [String],
            img_url: [String],
            video_id: String,
            video_url: String,
            options: [String],
            answer_type: String,
            correct_answer: String,
            student_answer: String,
            mark: Number,
            no: Number
        }
    ],
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'answer sheets'});

const model = mongoose.model('AnswerSheet', AnswerSheetSchema);
module.exports = model;