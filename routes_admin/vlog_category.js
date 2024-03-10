const express = require('express');
const jwt = require('jsonwebtoken');
const VlogCategory = require('../models/vlog_category');

const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();


// endpoint to create vlog_category
router.post('/create_vlog_category', async (req, res) => {
  const {token, vlog_category_name} = req.body;

  // check for required fields
  if(!token || !vlog_category_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // check if vlog_category endpoint exists
    const vlog_category = await VlogCategory.findOneAndUpdate(
      {doc_type: 'vlog category'},
      {$push: {categories: vlog_category_name}},
      {upsert: true, new: true}
    ).lean();

    return res.status(200).send({status: 'ok', msg: 'success', vlog_category});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to fetch categories
router.post('/view_vlog_categories', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch vlog_category document
    const vlog_category = await VlogCategory.findOne({doc_type: 'vlog category'}).lean();
    
    // check if courses where found
    if(!vlog_category)
      return res.status(200).send({status: 'ok', msg: 'no categories yet', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', categories: vlog_category.categories, count: vlog_category.categories.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred'});
  }
});


// endpoint to edit or delete a vlog_category
router.post('/edit_vlog_category', async (req, res) => {
  const {token, categories} = req.body;

  // check for required fields
  if(!token || !categories)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // edit vlog_category document
    const vlog_category = await VlogCategory.findOneAndUpdate({doc_type: 'vlog category'}, {categories}, {new: true}).lean();

    return res.status(200).send({status: 'ok', msg: 'vlog_category updated', vlog_category});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;