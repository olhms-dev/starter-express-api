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

// endpoint to view book
router.post('/view_book', async (req, res) => {
  const {token, book_id} = req.body;

  // check for required fields
  if(!token || !book_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch book document
    const book = await Book.findById({_id: book_id}).lean();

    return res.status(200).send({status: 'ok', msg: 'Success', book});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view books
router.post('/view_books', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch book document
    const books = await Book.find({is_deleted: false, class_name}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

    // check if books exist
    if(books.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no books at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', books, count: books.length});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;