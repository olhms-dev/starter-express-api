const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Book = require('../models/book');

dotenv.config();
const router = express.Router();

// create book
router.post('/create_book', upload.array('books'), async (req, res) => {
    const {token, title, class_name, author, school, about_book} = req.body;

    // check for required fields
    if(!token || !title || !class_name || !school || !author || req.files == null || req.files == undefined)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile file
        let pdf_url = '';
        let pdf_id = '';
        let img_url = '';
        let img_id = '';
        for(let i = 0; i < req.files.length; i++){         
            const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'books'});
            let ext = path.extname(req.files[i].originalname);
            console.log(ext);
            if(ext == '.pdf') {
                pdf_url = result.secure_url;
                pdf_id = result.public_id;
            } else {
                img_url = result.secure_url;
                img_id = result.public_id;
            }
        }
        
        // create a new book document and populate it
        let book = new Book;
        book.title = title;
        book.class_name = class_name;
        book.author = author;
        book.school = school;
        book.about_book = about_book || '';
        book.pdf_url = pdf_url || '';
        book.pdf_id = pdf_id || '';
        book.img_url = img_url || '';
        book.img_id = img_id || '';
        book.timestamp = Date.now();

        await book.save();

        return res.status(200).send({status: 'ok', msg: 'Success', book});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to edit book
router.post('/edit_book', upload.array('books'), async (req, res) => {
    const {token, author, class_name, title, book_id} = req.body;

    // check for required fields
    if(!token || !book_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile files        
        let book = await Book.findById({_id: book_id}).lean();
        let pdf_url = '';
        let pdf_id = '';
        let img_url = '';
        let img_id = '';
        for(let i = 0; i < req.files.length; i++){   
            let extname = path.extname(req.files[i].originalname);
            if(extname == '.pdf') {
                if(book.pdf_id != '') {
                  await cloudinary.uploader.destroy(book.pdf_id);    
                }          
            } else {
                if(book.img_id != '') {
                  await cloudinary.uploader.destroy(book.pdf_id);    
                }         
            }
            const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'books'});
            let ext = path.extname(req.files[i].originalname);
            if(ext == '.pdf') {
                pdf_url = result.secure_url;
                pdf_id = result.public_id;
            } else {
                img_url = result.secure_url;
                img_id = result.public_id;
            }
        }
        
        // fetch and update document
        book = await Book.findByIdAndUpdate(
            {_id: book_id},
            {
                class_name: class_name || book.class_name,
                title: title || book.title,
                school: school || book.school,
                author: author || book.author,
                pdf_url: pdf_url || book.pdf_url,
                pdf_id: pdf_id || book.pdf_id,
                img_url: img_url || book.img_url,
                img_id: img_id || book.img_id
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', book});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

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
    if(!token || !class_name)
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

// endpoint to delete book
router.post('/delete_book', async (req, res) => {
    const {token, book_id} = req.body;

    // check for required fields
    if(!token || !book_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch book document
        await Book.updateOne({_id: book_id}, {is_deleted: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success'});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;