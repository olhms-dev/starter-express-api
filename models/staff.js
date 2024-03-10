const mongoose = require('mongoose');

const StaffSchema = mongoose.Schema({
    firstname: String,
    middlename: String,
    lastname: String,
    address: String,
    staff_id: String,
    email: String,
    phone_no1: String,
    phone_no2: String,
    password: String,
    country: String,
    religion: String,
    gender: String,
    center: String,
    class_name: String,
    role: String,
    employment_year: Number,
    img_url: String,
    img_id: String,
    is_online: {type: Boolean, default: false},
    last_login: Number,
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'staff'});

const model = mongoose.model('Staff', StaffSchema);
module.exports = model;