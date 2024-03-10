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
    const {blog_id} = req.body;

    // check for required fields
    if(!blog_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // fetch blog document
        const blog = await Blog.findOneAndUpdate({_id: blog_id}, {$inc: {view_count: 1}}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', blog});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view blogs
router.post('/view_blogs', async (req, res) => {
    try{
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

// endpoint to search blog posts

router.post('/search_blogs', async (req, res) => {
    const {search_string, pagec} = req.body;
  
    if(!search_string || search_string == '' || search_string == undefined){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }
  
    try{
  
        const resultsPerPage = 1000;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;
  
        // exclude other fields in the document
  
        const blogs = await Blog.find({
            '$or': [
            {title: new RegExp(search_string, 'i')},
            {body: new RegExp(search_string, 'i')}
        ]})
        .sort({timestamp: "desc"})
        .limit(resultsPerPage)
        .skip(resultsPerPage * page)
        .lean();
  
        if(blogs.length === 0){
            return res.status(200).send({status: 'ok', msg: 'No blogs found', count: blogs.length, blogs});
        }
  
        return res.status(200).send({status: 'ok', msg: 'Success', count: blogs.length, blogs});
  
    }catch (e){
        console.log(e);
        return res.status(400).send({status: 'error', msg: e});
    }
  
  });

module.exports = router;