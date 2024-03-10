const mongoose = require('mongoose');

const GallerySchema = mongoose.Schema({
    gallery_name: String,
    ids: [String],
    urls: [String],
    type: String, // image or video
    img_url: String, // cover image for a video
    img_id: String, // id of the cover image
    duration: String, // duration of a video
    timestamp: Number,
    is_deleted: {type: Boolean, default: false}
}, {collection: 'gallery'});

const model = mongoose.model('Gallery', GallerySchema);
module.exports = model;