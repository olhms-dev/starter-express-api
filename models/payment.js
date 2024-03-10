const mongoose = require('mongoose');

const PaymentSchema = mongoose.Schema({
    student_name: String,
    student_id: String,
    payment_id: String,
    payment_type: String,
    addmission_year: Number,
    payment_date: String,
    item_description: String,
    amount: String,
    session: String,
    term: String,
    description: String,
    admin_name: String,
    verdict: String,
    timestamp: Number,
    login_code: String,
    amount_in_words: String
}, { collection: 'payments' });

const model = mongoose.model('Payment', PaymentSchema);
module.exports = model;