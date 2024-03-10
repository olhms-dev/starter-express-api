const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const ClassVideo = require('../models/class_video');

dotenv.config();
const router = express.Router();

// endpoint to create class video
router.post('/create_class_video', upload.single('class_video'), async (req, res) => {
    const {token, subject, week, lesson, uploader_name, title} = req.body;

    // check for required fields
    if(!token || !subject || !week ||!lesson || !title || !uploader_name)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

 
    try{
        // verify token
        const teacher = jwt.verify(token, process.env.JWT_SECRET);
        // upload class video
        let video_url = '';
        let video_id = '';
        if(req.file) {            
            const result = await cloudinary.uploader.upload(req.file.path, {folder: 'class_videos'});
            console.log(result);
            video_url = result.secure_url;
            video_id = result.public_id;
        }
        
        // create a new class_video document and populate it
        let class_video = new ClassVideo;
        class_video.subject = subject;
        class_video.week = week;
        class_video.lesson = lesson;
        class_video.title = title;
        class_video.uploader_name = uploader_name;
        class_video.uploader_id = teacher._id;
        class_video.video_url = video_url;
        class_video.video_id = video_id;
        class_video.timestamp = Date.now();

        await class_video.save();

        return res.status(200).send({status: 'ok', msg: 'Success', class_video});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to edit class_video
router.post('/edit_class_video', upload.single('class_video'), async (req, res) => {
    const {token, subject, lesson, week, title, class_video_id} = req.body;

    // check for required fields
    if(!token || !class_video_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // upload class video
        let video_url = '';
        let video_id = '';
        if(req.file) {            
            const result = await cloudinary.uploader.upload(req.file.path, {folder: 'class_videos'});
            console.log(result);
            video_url = result.secure_url;
            video_id = result.public_id;
        }
        
        // fetch and update document
        let class_video = await ClassVideo.findById({_id: class_video_id}).lean();

        class_video = await ClassVideo.findByIdAndUpdate(
            {_id: class_video_id},
            {
                subject: subject || class_video.subject,
                lesson: lesson || class_video.lesson,
                week: week || class_video.week,
                video_url: video_url || class_video.video_url,
                video_id: video_id || class_video.video_id,
                title: title || class_video.title,
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', class_video});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

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

// endpoint to delete class_video
router.post('/delete_class_video', async (req, res) => {
    const {token, class_video_id} = req.body;

    // check for required fields
    if(!token || !class_video_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch class_video document
        const class_video = await ClassVideo.findByIdAndUpdate({_id: class_video_id}, {is_deleted: true}, {new: true}).lean();

        await cloudinary.uploader.destroy(class_video.video_id);

        return res.status(200).send({status: 'ok', msg: 'success'});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;