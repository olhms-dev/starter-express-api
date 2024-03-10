const mongoose = require('mongoose');

const storeItemSchema = mongoose.Schema({
    product_name: String,
    img_url: {type: String, default: 'a'},
    img_id: {type: String, default: 'a'},
    cost_price: String,
    sell_price: String,
    category: String,
    stock_level: {type: Number, default: 0},
    timestamp: Number
}, {collection: 'store_items'});

const model = mongoose.model('StoreItem', storeItemSchema);
module.exports = model;