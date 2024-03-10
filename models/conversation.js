const mongoose = require('mongoose');

const convoSchema = mongoose.Schema({
  members: [String],
  timestamp: Number,
  conv_type: { type: String, default: 'chat' },
  latest_message: {
    _id: String,
    timestamp: Number,
    conversation_id: String,
    sender_name: String,
    sender_id: String,
    sender_img: String,
    content: String
  },

}, { collection: 'conversations' });

const model = mongoose.model('Conversation', convoSchema);
module.exports = model;