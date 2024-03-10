const mongoose = require('mongoose');

const AvatarSchema = mongoose.Schema({
    doc_type: {type: String, default: 'avatars'},
    urls: [String],
    ids: [String],
    is_deleted: {type: Boolean, default: false},
    timestamp: Number
}, {collection: 'avatars'});

const model = mongoose.model('Avatar', AvatarSchema);
module.exports = model;