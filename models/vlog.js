const mongoose = require('mongoose');
const { Schema } = mongoose;

const VlogSchema = new Schema({
    title: { type: String, requried: true },
    category: String,
    summary: String,
    video_url: String,
    video_id: String,
    preview: String,
    duration: String,
    view_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    like_count: { type: Number, default: 0 },
    likes: [String],
    img_id: String,
    img_url: String,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'vlogs' });

const model = mongoose.model('Vlog', VlogSchema);
module.exports = model;