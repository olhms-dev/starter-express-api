const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
    product_name: String,
    price: String,
    category: String,
    cost_price: { type: Number, default: 0 },
    selling_price: { type: Number, default: 0 },
    quantity_received: { type: Number, default: 0 },
    current_stock_level: { type: Number, default: 0 },
    new_stock_level: { type: Number, default: 0 },
    img_url: String,
    img_id: String,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'products' });

const model = mongoose.model('Product', ProductSchema);
module.exports = model;