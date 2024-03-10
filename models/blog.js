const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlogSchema = new Schema({
    title: { type: String, requried: true },
    body: String,
    duration: String,
    img_url: String,
    img_id: String,
    view_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    like_count: { type: Number, default: 0 },
    likes: [String],
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'blogs' });

const model = mongoose.model('Blog', BlogSchema);
module.exports = model;