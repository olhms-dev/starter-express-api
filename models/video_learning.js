const mongoose = require('mongoose');
const { Schema } = mongoose;

const VideoLearningSchema = new Schema({
    title: { type: String, requried: true },
    summary: String,
    video_url: String,
    video_id: String,
    view_count: { type: Number, default: 0 },
    img_id: String,
    img_url: String,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'video learning videos' });

const model = mongoose.model('VideoLearning', VideoLearningSchema);
module.exports = model;