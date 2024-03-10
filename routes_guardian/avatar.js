const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');

dotenv.config();
const router = express.Router();

// endpoint to upload avatar(s)
router.post('/upload_avatar', upload.single('avatars'), async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token || req.file == undefined || req.file == null)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    // jwt.verify(token, process.env.JWT_SECRET);
    
    let url = '';
    let id = '';
    let result = await cloudinary.uploader.upload(req.file.path, {folder: 'avatars', quality: 'auto', fetch_format: "auto"});
    url = result.secure_url;
    id = result.public_id;
      
    return res.status(200).send({status: 'ok', msg: 'success', url});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;