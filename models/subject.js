const mongoose = require('mongoose');

const SubjectSchema = mongoose.Schema({
    subject_name: String,
    preview: String,
    class_name: String,
    school: String,
    total_no_lessons: Number,
    session: String,
    lessons: [{
        week_no: Number,
        term: String,
        no_lessons: Number,
        locked: {type: Boolean, default: true},
        lesson: [{
            title: String,
            lesson_url: String,
            lesson_id: String,
            lesson_no: Number,
            lesson_type: String, // video or class note,
            duration: String, // the duration of the video
            thumbnail_url: String, // the cover image for the video or class note
            thumbnail_id: String,
            description: String
        }]
    }],
    // questions: [{
    //     question_id: String,
    //     term: String,
    //     session: String
    // }],
    is_deleted: { type: Boolean, default: false },
    timestamp: Number
}, { collection: 'subjects' });

const model = mongoose.model('Subject', SubjectSchema);
module.exports = model;