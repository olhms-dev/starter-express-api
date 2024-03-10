const mongoose = require('mongoose');
const {Schema} = mongoose;

const GuardianSchema = new Schema({
    fullname: {type: String, required: true},
    email: {type: String, required: true},
    phone_no: {type: String, required: true},
    timestamp: Number,
    children: [{
        student_id: String,
        fullname: String,
        avatar_url: String,
        class_name: String,
        login_code: String
    }],
    is_online: {type: Boolean, default: false},
    last_login: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'guardians'});

const model = mongoose.model('Guardian', GuardianSchema);
module.exports = model;