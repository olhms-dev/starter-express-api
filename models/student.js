const mongoose = require('mongoose');
const { Schema } = mongoose;

const StudentSchema = new Schema({
    student_id: String,
    firstname: String,
    lastname: String,
    middlename: String,
    gender: String,
    country: String,
    address: String,
    fullname: String,
    password: String,
    religion: String,
    date_of_birth: String,
    place_of_birth: String,
    special_needs: String,
    class_name: { type: String, required: true },
    repeated_classes: [String],
    center: String,
    login_code: { type: String, required: true },
    img_url: String,
    img_id: String,
    addmission_year: String,
    academic_details: {
        previous_school_one: String,
        class_one: String,
        previous_school_two: String,
        class_two: String
    },
    emergency_info: {
        fullname: String,
        phone_no: String
    },
    guardian_info: {
        fullname: String,
        guardian_id: String,
        phone_no: String,
        email: String,
        office_addrress: String,
        occupation: String,
        first_img_id: String,
        first_img_url: String,
        second_img_id: String,
        second_img_url: String,
        address: String
    },
    health_matters: {
        fullname: String,
        phone_no: String,
        disabilities: String
    },
    current_term: String,
    current_session: String,
    is_online: { type: Boolean, default: false },
    last_login: Number,
    timestamp: Number,
    is_deleted: { type: Boolean, default: false }
}, { collection: 'students' });

const model = mongoose.model('Student', StudentSchema);
module.exports = model;