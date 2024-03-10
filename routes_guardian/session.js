const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const Session = require('../models/session');

dotenv.config();
const router = express.Router();


// endpoint to view session
router.post('/view_session', async (req, res) => {
  const {token, session} = req.body;

  // check for required fields
  if(!token || !session)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
      // verify token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // fetch session document
    const sessionM = await Session.findOne({is_deleted: false, category: 'session'}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

    // check if session exist
    if(!sessionM)
      return res.status(200).send({status: 'ok', msg: `no session ${session} with at the moment`, count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', sessionM});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view current session
router.post('/view_current_session', async (req, res) => {
  const {token} = req.body;
  
  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch session document
    const sessionM = await Session.findOne({is_deleted: false, current_session: true}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

    // check if session exist
    if(!sessionM)
      return res.status(200).send({status: 'ok', msg: 'no current session at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', sessionM});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;