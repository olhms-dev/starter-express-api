const mongoose = require('mongoose');

const NotificationSchema = mongoose.Schema({
    noti_type: String,
    content: String,
    sender_id: String,
    receiver_id: String,
    email: String,
    receiver_ids: [String],
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'notifications'});

const model = mongoose.model('Notification', NotificationSchema);
module.exports = model;