const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Blog = require('../models/blog');

dotenv.config();
const router = express.Router();

// endpoint to view blog
router.post('/view_blog', async (req, res) => {
    const {token, blog_id} = req.body;

    // check for required fields
    if(!token || !blog_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch blog document
        const blog = await Blog.findById({_id: blog_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', blog});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view blogs
router.post('/view_blogs', async (req, res) => {
    const {token} = req.body;
    
    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch blog document
        const blogs = await Blog.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if blogs exist
        if(blogs.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no blogs at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', blogs, count: blogs.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;