const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const ClassVideo = require('../models/class_video');

dotenv.config();
const router = express.Router();

// endpoint to view class_video
router.post('/view_class_video', async (req, res) => {
    const {token, class_video_id} = req.body;

    // check for required fields
    if(!token || !class_video_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch class_video document
        const class_video = await ClassVideo.findById({_id: class_video_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', class_video});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view class_videos
router.post('/view_class_videos', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch class_video document
        const class_videos = await ClassVideo.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, video_id: 0}).lean();

        // check if class_videos exist
        if(class_videos.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no class_videos at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', class_videos, count: class_videos.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;