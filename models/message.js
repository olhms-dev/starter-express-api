const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  timestamp: Number,
  conversation_id: String,
  sender_name: String,
  sender_id: String,
  content: String,
  message_type: { type: String, default: 'text' },
  file_name: { type: String, default: '' }
}, { collection: 'messages' });

const model = mongoose.model('Message', messageSchema);
module.exports = model;