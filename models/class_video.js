const mongoose = require('mongoose');

const ClassVideoSchema = mongoose.Schema({
    subject: String,
    video_id: String,
    video_url: String,
    week: Number,
    title: String,
    lesson: Number,
    uploader_name: String,
    uploader_id: String,
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'class videos'});

const model = mongoose.model('ClassVideo', ClassVideoSchema);
module.exports = model;