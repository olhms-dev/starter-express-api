const mongoose = require('mongoose');

const SchoolSchema = mongoose.Schema({
    school_name: String,
    overview: String,
    curriculum: String,
    entry_requirements: String,
    tuition: Number,
    experience: String,
    img_ids: [String],
    img_urls: [String],
    pdf_url: String,
    pdf_id: String,
    timestamp: Number,
    is_deleted: {type: String, default: false}
}, {collection: 'schools'});

const model = mongoose.model('School', SchoolSchema);
module.exports = model;