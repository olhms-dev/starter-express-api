const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Staff = require('../models/staff');

dotenv.config();
const router = express.Router();

// endpoint to view teacher of a class
router.post('/view_class_teacher', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch teacher document
    const teacher = await Staff.findOne({class_name, role: 'teacher'}).lean();

    // check if teacher exists
    if(!teacher)
      return res.status(200).send({status: 'ok', msg: `no teacher found for this class ${class_name}`});

    return res.status(200).send({status: 'ok', msg: 'success', teacher});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view teacher of a class
router.post('/view_head_teacher', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch teacher document
    const head_teacher = await Staff.findOne({class_name, role: 'head_teacher'}).lean();

    // check if head teacher exists
    if(!head_teacher)
      return res.status(200).send({status: 'ok', msg: `no head teacher found for this class ${class_name}`});

    return res.status(200).send({status: 'ok', msg: 'success', head_teacher});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});
module.exports = router;