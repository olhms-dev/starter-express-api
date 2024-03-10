const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema({
    doc_type: { type: String, default: 'settings' },
    first_ca_active: Boolean,
    second_ca_active: Boolean,
    examination_active: Boolean,
    grading_system: {
        level_one: {score_range: String, grade: String, remark: String},
        level_two: {score_range: String, grade: String, remark: String},
        level_three: {score_range: String, grade: String, remark: String},
        level_four: {score_range: String, grade: String, remark: String},
        level_five: {score_range: String, grade: String, remark: String}
    },
    time_changed: Number,
    admin_name: String,
    admin_img: String,
    admin_id: String, // staff id of the admin
    timestamp: Number
}, { collection: 'settings' });

const model = mongoose.model('Settings', settingsSchema);
module.exports = model;