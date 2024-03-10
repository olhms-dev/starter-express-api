const mongoose = require('mongoose');
const {Schema} = mongoose;

const ClasSchema = new Schema({
    class_name: String,
    school: String,
    no_of_students: {type: Number, default: 0},
    overview: String,
    entry_requirements: String,
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'classess'});

const model = mongoose.model('Clas', ClasSchema);
module.exports = model;