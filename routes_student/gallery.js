const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Gallery = require('../models/gallery');

dotenv.config();
const router = express.Router();

// endpoint to view single gallery
router.post('/view_single_gallery', async (req, res) => {
    const {gallery_id} = req.body;

    // check for required fields
    if(!gallery_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // fetch gallery document
        const gallery = await Gallery.findById({_id: gallery_id}, {timestamp: 0}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', gallery});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view all gallery
router.post('/view_all_gallery', async (req, res) => {
    try{
        const gallery = await Gallery.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, ids: 0}).lean();

        // check if gallerys exist
        if(gallery.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no gallerys at the moment', count: 0, gallery: []});

        return res.status(200).send({status: 'ok', msg: 'success', gallery, count: gallery.length});

        
    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;