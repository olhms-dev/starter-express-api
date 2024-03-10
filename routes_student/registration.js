const express = require('express');
const dotenv = require('dotenv');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Registration = require('../models/registration');
const Statistics = require('../models/statistics');
const PaymentCode = require('../models/payment_code');

dotenv.config();
const router = express.Router();

// endpoint to register a student
router.post('/register', upload.single('student-images'), async (req, res) => {

  const {famname, firstname, address, religion, emergency_info, gender, date_of_birth, place_of_birth, academic_details, special_needs, health_matters, nationality, guardian_info, class_name, payment_code, middlename} = req.body;

  // check for required fields
  // !religion ||   add it later
  if(!famname || !firstname || !emergency_info || !guardian_info || !academic_details || !gender || !special_needs || !nationality || !date_of_birth || !place_of_birth || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // upload profile picture
    let img_url = '';
    let img_id = '';
    if(req.file) {            
      const result = await cloudinary.uploader.upload(req.file.path, {folder: 'student-images'});
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    const timestamp = Date.now();
    
    // create a new registrtion document
    let reg_doc = new Registration;
    reg_doc.fullname = `${firstname} ${famname}`;
    reg_doc.middlename = middlename || '';
    reg_doc.lastname = famname;
    reg_doc.address = address || '';
    reg_doc.religion = religion || '';
    reg_doc.academic_details = JSON.parse(academic_details);
    reg_doc.firstname = firstname;
    reg_doc.emergency_info = JSON.parse(emergency_info);
    reg_doc.guardian_info = JSON.parse(guardian_info);
    reg_doc.class_name = class_name;
    reg_doc.date_of_birth = date_of_birth;
    reg_doc.place_of_birth = place_of_birth;
    reg_doc.gender = gender;
    reg_doc.special_needs = special_needs;        
    reg_doc.nationality = nationality;
    reg_doc.health_matters = JSON.parse(health_matters);
    reg_doc.login_code = timestamp;
    reg_doc.application_date = new Date(timestamp).toLocaleDateString();
    reg_doc.img_url = img_url || '';
    reg_doc.img_id = img_id || ''; 
    reg_doc.interview_date = ''; 
    reg_doc.interview_time = ''; 
    reg_doc.center = ''; 
    reg_doc.student_id = Date.now();
    reg_doc.timestamp = timestamp;

    reg_doc = await reg_doc.save();



    // update statistics document
    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_of_applications: 1}}, {upsert: true}).lean();

    // delete payment code document
    if(payment_code){
      await PaymentCode.deleteOne({payment_code}).lean();
    }

    return res.status(200).send({status: 'ok', msg: 'success', reg_doc});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to upload file
router.post('/upload_file', upload.single('guardian-images'), async (req, res) => {
  const {} = req.body;
  
  // check for required fields
  if(req.file === undefined || req.file === null)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
    
  try{
    
    // upload files
    let url = '';
    let id = '';        
    const result = await cloudinary.uploader.upload(req.file.path, {folder: 'guardian-images'});
    url = result.secure_url;
    id = result.public_id;

    return res.status(200).send({status: 'ok', msg: 'success', img_details: {url, id}});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;