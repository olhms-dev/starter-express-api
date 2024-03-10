const mongoose = require('mongoose');
const {Schema} = mongoose;

const RegistrationSchema = new Schema({
    student_id: String,
    firstname: String,
    middlename: String,
    lastname: String,
    gender: String,
    address: String,
    fullname: {type: String, required: true},
    religion: String,
    date_of_birth: String,
    place_of_birth: String,
    special_needs: String,
    nationality: String,
    addmission_year: String,
    class_name: {type: String, required: true},
    center: String,
    img_url: String,
    img_id: String,
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
        address: String,
        office_address: String,
        occupation: String,
        first_img_id: String,
        first_img_url: String,
        second_img_id: String,
        second_img_url: String
    },
    health_matters: {
        fullname: String,
        phone_no: String,
        disabilities: String
    },
    application_date: String,
    interview_date: String,
    interview_time: String,
    is_admitted: {type: Boolean, default: false},
    is_processed: {type: Boolean, default: false},
    new_registration: {type: Boolean, default: true},
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'registrations'});

const model = mongoose.model('Registration', RegistrationSchema);
module.exports = model;