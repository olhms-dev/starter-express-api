const mongoose = require('mongoose');

const BookSchema = mongoose.Schema({
    class_name: String,
    school: String,
    title: String,
    pdf_url: String,
    pdf_id: String,
    img_url: String,
    img_id: String,
    author: String,
    about_book: String,
    is_completed: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'books'});

const model = mongoose.model('Book', BookSchema);
module.exports = model;