const mongoose = require('mongoose');

const FaqsSchema = new mongoose.Schema({
    question: String,
    answer: String,
    timestamp: Number, 
    is_deleted: {type: Boolean, default: false}
}, {collection: 'frequently asked questions'});

const model = mongoose.model('Faqs', FaqsSchema);
module.exports = model;