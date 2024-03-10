const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    items: [{
        product_name: String,
        quantity: String,
        price: String
    }],
    img_url: {type: String, default: 'a'},
    student_name: String,
    class_name: String,
    session: String,
    student_id: String,
    day: String,
    month: String,
    year: String,
    timestamp: Number    
}, {collection: 'invoice'});

const model = mongoose.model('Invoice', invoiceSchema);
module.exports = model;