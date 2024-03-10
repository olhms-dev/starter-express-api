const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Book = require('../models/book');
const Guardian = require('../models/guardian');

dotenv.config();
const router = express.Router();

// endpoint to search for books
router.post('/search_books', async (req, res) => {
    const {token, search_string, pagec} = req.body;
  
    // check for required fields
    if(!token || !pagec || !search_string)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      const resultsPerPage = 10;
      let page = pagec >= 1 ? pagec : 1;
      page = page -1;
  
      // fetch books documents
      const books = await Book.find({
        is_deleted: false,
        $or: [
        { author: new RegExp(search_string, 'i') },
        { title: new RegExp(search_string, 'i') },
        { class_name: new RegExp(search_string, 'i')},
        { about_book: new RegExp(search_string, 'i') },
        ]}
      )
      .skip(resultsPerPage * page)
      .limit(resultsPerPage)
      .sort({timestamp: 'desc'})
      .lean();
  
      // check if books where found
      if(books.length === 0)
        return res.status(200).send({status: 'ok', msg: 'no book found', count: 0});
    
      return res.status(200).send({status: 'ok', msg: 'books fetched successfully', books , count: books.length});
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

  module.exports = router;