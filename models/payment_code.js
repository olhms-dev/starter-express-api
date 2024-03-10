const mongoose = require('mongoose');

const PaymentCodeSchema = mongoose.Schema({
    payment_code: Number,
}, { collection: 'payment codes' });

const model = mongoose.model('PaymentCode', PaymentCodeSchema);
module.exports = model;