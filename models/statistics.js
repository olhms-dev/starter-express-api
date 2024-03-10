const mongoose = require('mongoose');
const {Schema} = mongoose;

const StatisticsSchema = new Schema({
    doc_type: {type: String, default: 'statistics'},
    no_of_admins: {type: Number, default: 0},
    no_of_students: {type: Number, default: 0},
    no_of_staff: {type: Number, default: 0},
    no_of_applications: {type: Number, default: 0},
    timestamp: Number,
    is_deleted: {type: Boolean, default: false},
    no_get_in_touches: {type: Number, default: 0},
    no_of_store_items: {type: Number, default: 0},
    no_new_store_requests: {type: Number, default: 0},
    no_pending_store_requests: {type: Number, default: 0},
    no_collected_store_requests: {type: Number, default: 0}
}, {collection: 'statistics'});

const model = mongoose.model('Statistics', StatisticsSchema);
module.exports = model;