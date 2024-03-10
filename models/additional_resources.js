const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdditionalResourcesSchema = new Schema({
    title: { type: String, requried: true },
    lesson_url: String,
    lesson_id: String,
    
    thumbnail_url: String,
    thumbnail_id: String,
    timestamp: Number,
    subject_name: String,
    class_name: String,
    week: Number,
    term: String,
    session: String,
    lesson_type: String,
    lesson_no: Number,
    description: String,
    
    is_deleted: { type: Boolean, default: false }
}, { collection: 'additional resources' });

const model = mongoose.model('AdditionalResources', AdditionalResourcesSchema);
module.exports = model;
