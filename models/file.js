const mongoose = require('mongoose');
const { Schema } = mongoose;

const fileSchema = new Schema({
    filename: String,
    file_url: String,
    file_id: String, // returned by cloudinary used in deleting files in cloudinary
    timestamp: Number
}, { collection: 'files' });

const model = mongoose.model('File', fileSchema);
module.exports = model;