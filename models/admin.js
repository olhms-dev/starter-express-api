const mongoose = require('mongoose');

const AdminSchema = mongoose.Schema({
    firstname: String,
    lastname: String,
    address: String,
    staff_id: String,
    email: String,
    phone_no1: String,
    phone_no2: String,
    password: String,
    country: String,
    state: String,
    religion: String,
    gender: String,
    center: String,
    roles: [String],
    employment_year: Number,
    img_url: String,
    img_id: String,
    is_online: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'admins'});

const model = mongoose.model('Admin', AdminSchema);
module.exports = model;