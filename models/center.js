const mongoose = require('mongoose');
const {Schema} = mongoose;

const CenterSchema = new Schema({
    center_name: String,
    no_of_staff: {type: Number, default: 0},
    no_of_students: {type: Number, default: 0},
    babies_and_toddlers: {
        no_of_creche: {type: Number, default: 0},
        no_of_toddlers: {type: Number, default: 0},
        total: {type: Number, default: 0}
    },
    infant_school: {
        infant_community_one: {type: Number, default: 0},
        infant_community_two: {type: Number, default: 0},
        nursery_one: {type: Number, default: 0},
        nursery_two: {type: Number, default: 0},
        total: {type: Number, default: 0}
    },
    grade_school: {
        grade_one: {type: Number, default: 0},
        grade_two: {type: Number, default: 0},
        grade_three: {type: Number, default: 0},
        grade_four: {type: Number, default: 0},
        grade_five: {type: Number, default: 0},
        total: {type: Number, default: 0}
    },
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'centers'});

const model = mongoose.model('Center', CenterSchema);
module.exports = model;