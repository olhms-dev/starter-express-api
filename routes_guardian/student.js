const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Student = require('../models/student');
const Registration = require('../models/registration');

dotenv.config();
const router = express.Router();


// endpoint to view guardian
router.post('/view_sudent_profile', async (req, res) => {
    const {token, student_id} = req.body;

    // check for required fields
    if(!token || !student_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch student document
        const student = await Student.findOne({student_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', student});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to check class of student when admitted
router.post('/view_sudent_class_on_addmission', async (req, res) => {
    const {token, student_id} = req.body;

    // check for required fields
    if(!token || !student_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch student document
        const student = await Registration.findOne({student_id, is_admitted: true, is_processed: true}, {class_name: 1}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', student_class_on_addmission: student.class_name});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to edit student profile
router.post('/edit_student_profile', async (req, res) => {
    const {token, student_id, permanent_address, country, parent_phone, parent_email} = req.body;
  
    // check for required fields
    if(!token || !student_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
      let student = await Student.findOne({student_id});

      // check if student documents exist
      if(!student)
        return res.status(200).send({status: 'ok', msg: `No student with id: ${student_id} found`});
  
        student.country = country || student.country;
        student.address = permanent_address || student.address;
        student.guardian_info.address = permanent_address || student.guardian_info.address;
        student.guardian_info.phone_no = parent_phone || student.guardian_info.phone_no;
        student.guardian_info.email = parent_email || student.guardian_info.email;

        student = await student.save();
      // // fetch student document
      // student = await Student.findOneAndUpdate({student_id}, {
      //   country: country || student.country,
      //   'guardian_info.address': permanent_address || student.guardian_info.address,
      //   'guardian_info.phone_no': parent_phone || student.guardian_info.phone_no,
      //   'guardian_info.email': parent_email || student.guardian_info.email
      // }, {new: true}).lean();
  
      

        // let img_url = '';
        // let img_id = '';
        // if(req.file) {   
        //     if(student.img_id != '') {
        //       await cloudinary.uploader.destroy(student.img_id);    
        //     }    
        //     const result = await cloudinary.uploader.upload(req.file.path, {folder: 'student-images'});
           
        //     img_url = result.secure_url;
        //     img_id = result.public_id;
        // }
  
      
  
      return res.status(200).send({status: 'ok', msg: 'success', student});
  
    } catch(e) {
      return res.status(500).send({status: 'error', msg: 'some error occurred', error: e.toString()});
    }
  });

module.exports = router;