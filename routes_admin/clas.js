const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Clas = require('../models/clas');

dotenv.config();
const router = express.Router();

// endpoint to clas
router.post('/view_clas', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch clas document
    const clas = await Clas.findOne({is_deleted: false, class_name}).lean();

    // check if clas documents exist
    if(!clas)
      return res.status(200).send({status: 'ok', msg: `no class with the name ${class_name} at the moment`});

    return res.status(200).send({status: 'ok', msg: 'success', clas});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view classes
router.post('/view_classes', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch clas document
    const clas = await Clas.find({is_deleted: false}).lean();

    // check if clas documents exist
    if(clas.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no class at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', clas, count: clas.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;