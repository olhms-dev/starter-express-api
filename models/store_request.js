const mongoose = require('mongoose');

const storeRequestSchema = mongoose.Schema({
    student_id: String,
    student_name: String,
    phone_no: String,
    email: String,
    admission_year: String,
    session: String,
    term: String,
    student_class: String,
    store_items: [{
        product_name: String,
        img_url: String,
        price: String,
        quantity: String,
        size: String,
        _id: String
    }],
    collector_name: {type: String, default: ''},
    collection_date: {type: String, default: ''},
collection_timestamp: {type: Number, default: 0},
    request_status: {type: String, default: 'new'}, // new, pending, collected
    timestamp: Number
}, {collection: 'store_requests'});

const model = mongoose.model('StoreRequest', storeRequestSchema);
module.exports = model;