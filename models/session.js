const mongoose = require('mongoose');

const SessionSchema = mongoose.Schema({
    doc_type: { type: String, default: 'session' },
    session: String,
    current_term: String,
    next_term_resumption_date: String,
    current_session: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    time_changed: Number,
    admin_name: String,
    admin_img: String,
    admin_id: String, // staff id of the admin
    timestamp: Number
}, { collection: 'sessions' });

const model = mongoose.model('Session', SessionSchema);
module.exports = model;