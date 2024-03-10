const express = require('express');
const jwt = require('jsonwebtoken');
const Category = require('../models/category');

const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();


// endpoint to create category
router.post('/create_category', async (req, res) => {
  const {token, category_name} = req.body;

  // check for required fields
  if(!token || !category_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // check if category endpoint exists
    const category = await Category.findOneAndUpdate(
      {doc_type: 'category'},
      {$push: {categories: category_name}},
      {upsert: true, new: true}
    ).lean();

    return res.status(200).send({status: 'ok', msg: 'success', category});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to fetch categories
router.post('/view_categories', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch category document
    const category = await Category.findOne({doc_type: 'category'}).lean();
    
    // check if courses where found
    if(!category)
      return res.status(200).send({status: 'ok', msg: 'no categories yet', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', categories: category.categories, count: category.categories.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred'});
  }
});


// endpoint to edit or delete a category
router.post('/edit_category', async (req, res) => {
  const {token, categories} = req.body;

  // check for required fields
  if(!token || !categories)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // edit category document
    const category = await Category.findOneAndUpdate({doc_type: 'category'}, {categories}, {new: true}).lean();

    return res.status(200).send({status: 'ok', msg: 'category updated', category});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;