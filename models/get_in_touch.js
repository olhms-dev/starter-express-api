const mongoose = require('mongoose');
const { Schema } = mongoose;

const getInTouchSchema = new Schema({
  fullname: String,
  phone_no: String,
  email: String,
  message: String,
  timestamp: Number,
  replied: {type: String, default: 'no'}, //yes/no
  is_deleted: { type: Boolean, default: false }
}, { collection: 'get_in_touches' });

const model = mongoose.model('GetInTouch', getInTouchSchema);
module.exports = model;