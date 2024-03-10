const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Product = require('../models/product');
const Category = require('../models/category');

dotenv.config();
const router = express.Router();

// endpoint to view product
router.post('/view_product', async (req, res) => {
  const {token, product_id} = req.body;

  // check for required fields
  if(!token || !product_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch product document
    const product = await Product.findById({_id: product_id}).lean();

    return res.status(200).send({status: 'ok', msg: 'success', product});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view products
router.post('/view_products', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch product document
    const products = await Product.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

    // check if products exist
    if(products.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no products at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', products, count: products.length});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view products based on category
router.post('/view_category_products', async (req, res) => {
  const {token, category} = req.body;

  // check for required fields
  if(!token || !category)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch product document
    const products = await Product.find({is_deleted: false, category}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

    // check if products exist
    if(products.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no products for this category at the moment at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', products, count: products.length});


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

    // fetch categorie document
    const category = await Category.findOne({doc_type: 'category'}, {categories: 1}).lean();

    // check if categories exist
    if(!category)
      return res.status(200).send({status: 'ok', msg: 'no categories at the moment at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', categories: category.categories, count: category.categories.length});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;