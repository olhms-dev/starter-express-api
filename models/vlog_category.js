const mongoose = require('mongoose');
const {Schema} = mongoose;

const VlogCategorySchema = new Schema({
    doc_type: {type: String, default: 'vlog category'},
    categories: [String],
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'vlog categories'});

const model = mongoose.model('VlogCategorySchema', VlogCategorySchema);
module.exports = model;