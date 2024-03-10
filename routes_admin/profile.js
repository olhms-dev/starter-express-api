const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passwordGenerator = require('generate-password');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Admin = require('../models/admin');

const {
  FsAdmin,
  FieldValue,
} = require("../services/firebase_service_config");

dotenv.config();
const router = express.Router();

// endpoint to edit profile
router.post('/edit_profile', async (req, res) => {
  const {token, phone_no1, phone_no2, email, firstname, lastname, religion, address, country} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    let admin = jwt.verify(token, process.env.JWT_SECRET);
    
    // upload profile picture        
    let found = await Admin.findById({_id: admin._id}).lean();
    
    // fetch and update document
    admin = await Admin.findByIdAndUpdate(
      {_id: admin._id},
      {
        firstname: firstname || found.firstname,
        lastname: lastname || found.lastname,
        email: email || found.email,
        phone_no1: phone_no1 || found.phone_no1,
        phone_no2: phone_no2 || found.phone_no2,
        religion: religion || found.religion,
        address: address || found.address,
        country: country || found.country
      },
      {new: true}
    ).lean();

    await FsAdmin.doc(admin._id.toString()).set({
      fullname: `${firstname || found.firstname} ${lastname || found.lastname}`,
    });

    return res.status(200).send({status: 'ok', msg: 'success', admin});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view profile
router.post('/view_profile', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    let admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch admin document
    admin = await Admin.findById({_id: admin._id}).lean();

    return res.status(200).send({status: 'ok', msg: 'success', admin});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;