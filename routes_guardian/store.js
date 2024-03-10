const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const StoreItem = require('../models/store_item');
const Category = require('../models/category');
const Invoice = require('../models/invoice');
const StoreRequest = require('../models/store_request');

const {generateSearchRegex} = require("../functions/regex");

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
    const product = await StoreItem.findById({_id: product_id}).lean();

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
    const products = await StoreItem.find({}, {timestamp: 0, img_id: 0}).lean();

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

    // check for all and fetch dynamically
    let products = [];
    if(category.toLowerCase() === "all") {
        // fetch all product documents
        products = await StoreItem.find({}, {timestamp: 0, img_id: 0}).lean();
    } else {
        // fetch category product documents
        products = await StoreItem.find({category}, {timestamp: 0, img_id: 0}).lean();
    }
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

// endpoint to search for product
router.post('/search', async (req, res) => {
    const {token, search_string} = req.body;
  
    // check for required fields
    if(!token || !search_string)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // generate search regex
      const regex = generateSearchRegex(search_string);

      // fetch product document
      const products = await StoreItem.find({category: regex, product_name: regex}, {timestamp: 0, img_id: 0}).lean();
  
      // check if products exist
      if(products.length === 0)
        return res.status(200).send({status: 'ok', msg: 'no products found', count: 0});
  
      return res.status(200).send({status: 'ok', msg: 'success', products, count: products.length});
  
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to buy product
router.post('/buy_product', async (req, res) => {
    const {token, items, img_url, student_name, phone_no, email, admission_year, term, class_name, session, student_id} = req.body;
  
    // check for required fields
    if(!token || !items || !student_name || !class_name || !session || !img_url || !student_id || !phone_no || !email || ! admission_year || !term)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      const date = new Date();

      // create store item request document
      let store_request = new StoreRequest;
      store_request.store_items = items;
      store_request.student_id = student_id;
      store_request.phone_no = phone_no;
      store_request.email = email;
      store_request.admission_year = admission_year;
      store_request.term = term;
      store_request.session = session;
      store_request.student_name = student_name;
      store_request.class_name = class_name;
      store_request.session = session;
      store_request.img_url = img_url;
      store_request.timestamp = Date.now();

      await store_request.save();

      // create invoice document
      let invoice = new Invoice;
      invoice.items = items;
      invoice.student_name = student_name;
      invoice.class_name = class_name;
      invoice.session = session;
      invoice.img_url = img_url;
      invoice.student_id = student_id;
      invoice.day = date.getDay().toString();
      invoice.month = date.getMonth().toString();
      invoice.year = date.getFullYear().toString();
      invoice.timestamp = Date.now();

      await invoice.save();

      return res.status(200).send({status: 'ok', msg: 'success', invoice});  
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;