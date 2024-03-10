const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  comment: String,
  post_id: String,
  comment_id: String,
  owner_id: String,
  owner_name: String,
  owner_img: String,
  timestamp: Number,
  edited: { type: Boolean, default: false },
  likes: [String],
  like_count: { type: Number, default: 0 },
  reply_count: { type: Number, default: 0 },
  owner_email: String
}, { collection: 'comments' });

const model = mongoose.model('Comment', commentSchema);
module.exports = model; 