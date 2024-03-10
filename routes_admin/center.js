const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Center = require('../models/center');

dotenv.config();
const router = express.Router();

// endpoint to create center
router.post('/create_center', async (req, res) => {
  const {token, center_name} = req.body;

  // check for required fields
  if(!token || !center_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // create center document
    let center = new Center
    center.center_name = center_name;
    center.timestamp = Date.now();

    await center.save();

    return res.status(200).send({status: 'ok', msg: 'success', center});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to center
router.post('/view_center', async (req, res) => {
  const {token, center_name} = req.body;

  // check for required fields
  if(!token || !center_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch center document
    const center = await Center.findOne({is_deleted: false, center_name}).lean();

    // check if center documents exist
    if(!center)
      return res.status(200).send({status: 'ok', msg: `no center with the name ${center_name} at the moment`});

    return res.status(200).send({status: 'ok', msg: 'success', center});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view centers
router.post('/view_centers', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch center document
    const centers = await Center.find({is_deleted: false}).lean();

    // check if center documents exist
    if(centers.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no centers at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', centers, count: centers.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;