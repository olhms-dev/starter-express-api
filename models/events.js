const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    event_name: { type: String, requried: true },
    event_date: String,
    event_time: String,
    term: Number,
    month: String,
    category: String,  // news, events
    view_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    like_count: { type: Number, default: 0 },
    likes: [String],
    img_url: String,
    img_id: String,
    description: String,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'events' });

const model = mongoose.model('Event', EventSchema);
module.exports = model;