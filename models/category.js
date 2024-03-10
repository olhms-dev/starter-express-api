const mongoose = require('mongoose');
const {Schema} = mongoose;

const CategorySchema = new Schema({
    doc_type: {type: String, default: 'category'},
    categories: [String],
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'categories'});

const model = mongoose.model('CategorySchema', CategorySchema);
module.exports = model;