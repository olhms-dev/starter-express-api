const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Gallery = require('../models/gallery');

dotenv.config();
const router = express.Router();

// endpoint to view single gallery
router.post('/view_single_gallery', async (req, res) => {
  const {token, gallery_id} = req.body;

  // check for required fields
  if(!gallery_id || !token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch gallery document
    const gallery = await Gallery.findById({_id: gallery_id}, {timestamp: 0}).lean();

    return res.status(200).send({status: 'ok', msg: 'Success', gallery});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view video gallery
router.post('/view_video_gallery', async (req, res) => {
  const {token} = req.body;
  
  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const gallery = await Gallery.find({is_deleted: false, type: 'video'}, {is_deleted: 0, timestamp: 0, ids: 0}).lean();

    // check if gallerys exist
    if(gallery.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no gallery for videos at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', gallery, count: gallery.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});


// endpoint to view image gallery
router.post('/view_image_gallery', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch gallery document
    const gallery = await Gallery.find({is_deleted: false, type: 'image'}, {is_deleted: 0, timestamp: 0, ids: 0}).lean();

    // check if gallerys exist
    if(gallery.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no gallery for images at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', gallery, count: gallery.length});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;