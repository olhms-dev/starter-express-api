const mongoose = require('mongoose');
const { Schema } = mongoose;

const RequestSchema = new Schema({
    student_id: String,
    email: String,
    phone_no: String,
    addmission_year: String,
    session: String,
    term: String,
    class_name: String,
    products: [{
        product_name: String,
        img_url: String,
        amount: Number,
        price: Number,
        size: String
    }],
    ready_to_collect: { type: Boolean, default: false },
    new_request: { type: Boolean, default: true },
    is_collected: { type: Boolean, default: false },
    collector_name: String,
    collection_date: String,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'requests' });

const model = mongoose.model('RequestSchema', RequestSchema);
module.exports = model;