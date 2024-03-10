const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeaturedVideoSchema = new Schema({
  video_link: String,
  video_url: String,
  video_id: String,
  img_id: String,
  img_url: String,
  timestamp: Number,
  is_deleted: { type: Boolean, default: false }
}, { collection: 'featured videos' });

const model = mongoose.model('FeaturedVideo', FeaturedVideoSchema);
module.exports = model;