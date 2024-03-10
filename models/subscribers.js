const mongoose = require('mongoose');

const SubscribersSchema = mongoose.Schema({
    doc_type: {type: String, default: 'subscribe'},
    subscribers: [String],
    timestamp: Number
}, {collection: 'subscribers'});

const model = mongoose.model('Subscribers', SubscribersSchema);
module.exports = model;