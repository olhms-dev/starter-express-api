const mongoose = require('mongoose');

const ContinuosAssessment = mongoose.Schema({
    subject: String,
    class_name: String,
    ca: Number, // 1 or 2
    term: String,
    ca_date: String,
    ca_time: String,
    type: String, // exam, ca
    session: String,
    duration_a: String,
    duration_b: String,
    no_of_sections: Number, // 1 or 2 if the ca or exam has a theory section and objective section then two else one
    section_present: String, // a/b depending on wether objective questions or theory questions were added first
    questions_obj: [
        {
            section: {type: String, default: 'A'},
            question: String,
            question_type: String,
            img_ids: [String],
            img_urls: [String],
            options: [String],
            correct_answer: String,
            answer_type: String,
            mark: Number,
            no: Number
        }
    ],
    submissions_obj: [
        {
            student_name: String,
            student_id: String,
            section: String,
            score: Number, // the score of the subject
            answer_sheet_id: String,
            answers: [String]
        }
    ],
    questions_theory: [
        {
            section: {type: String, default: 'B'},
            question: String,
            question_type: String,
            video_url: String,
            video_id: String,
            video_type: String, // ext, int
            correct_answer: String,
            answer_type: String,
            mark: Number,
            no: Number
        }
    ],
    submissions_theory: [
        {
            student_name: String,
            student_id: String,
            section: String,
            score: Number, // the score of the subject
            answer_sheet_id: String,
            answers: [String]    
        }
    ],
    is_completed: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'continuos assessments'});

const model = mongoose.model('ContinuosAssessment', ContinuosAssessment);
module.exports = model;