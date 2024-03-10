const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Student = require('../models/student');

dotenv.config();
const router = express.Router();

// endpoint to fetch student
router.post('/view_student', async (req, res) => {
  const {token, student_id} = req.body;

  // check for required fields
  if(!token || !student_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch student document
    const student = await Student.findById({_id: student_id}).lean();

    // check if student documents exist
    if(!student)
      return res.status(200).send({status: 'ok', msg: 'no student found'});

    return res.status(200).send({status: 'ok', msg: 'success', student});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view students based on class name and session
router.post('/view_session_class_students', async (req, res) => {
  const {token, class_name, session} = req.body;

  // check for required fields
  if(!token || !class_name || !session)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch student document
    const students = await Student.find({is_deleted: false, class_name, current_session: session}).lean();

    // check if student documents exist
    if(students.length === 0)
      return res.status(200).send({status: 'ok', msg: `no students in the session ${session} and class ${class_name} at the moment`, count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', students, count: students.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view students based on class name
router.post('/view_class_students', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch student document
    const students = await Student.find({is_deleted: false, class_name}).lean();

    // check if student documents exist
    if(students.length === 0)
      return res.status(200).send({status: 'ok', msg: `no students in class ${class_name} at the moment`, count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', students, count: students.length});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view students
router.post('/view_students', async (req, res) => {
    const {token} = req.body;
  
    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // fetch student document
      const students = await Student.find({is_deleted: false}).lean();
  
      // check if student documents exist
      if(students.length === 0)
        return res.status(200).send({status: 'ok', msg: `no students at the moment`, count: 0});
  
      return res.status(200).send({status: 'ok', msg: 'success', students, count: students.length});
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
  });


// endpoint to search for students
router.post('/search_students', async (req, res) => {
  const {token, search_string, pagec} = req.body;

  if(!token || !search_string || search_string == '' || search_string == undefined){
      return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
  }

  try{
      jwt.verify(token, process.env.JWT_SECRET);

      const resultsPerPage = 1000;
      let page = pagec >= 1 ? pagec : 1;
      page = page -1;

      // exclude other fields in the document

      const students = await Student.find({
          '$or': [
          {firstname: new RegExp(search_string, 'i')},
          {middlename: new RegExp(search_string, 'i')},
          {lastname: new RegExp(search_string, 'i')},
          {center: new RegExp(search_string, 'i')}
      ]})
      .sort({timestamp: "desc"})
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

      if(students.length === 0){
          return res.status(200).send({status: 'ok', msg: 'No students found', count: students.length, students});
      }

      return res.status(200).send({status: 'ok', msg: 'Success', count: students.length, students});

  }catch (e){
      console.log(e);
      return res.status(400).send({status: 'error', msg: e});
  }

});

// endpoint to edit profile
router.post('/edit_student_profile', upload.single('student-images'), async (req, res) => {
  const {token, student_id, firstname, lastname, middlename} = req.body;

  // check for required fields
  if(!token || !student_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      // upload profile picture        
      let student = await Student.findOne({student_id});
      let img_url = '';
      let img_id = '';
      if(req.file) {   
          if(student.img_id != '') {
            await cloudinary.uploader.destroy(student.img_id);    
          }    
          const result = await cloudinary.uploader.upload(req.file.path, {folder: 'student-images'});
         
          img_url = result.secure_url;
          img_id = result.public_id;
      }

      student.img_id = img_id || student.img_id;
      student.img_url = img_url || student.img_url;
      student.firstname = firstname || student.firstname;
      student.lastname = lastname || student.lastname;
      student.middlename = middlename || student.middlename;
      student.fullname = `${student.firstname} ${student.middlename} ${student.lastname}`

      student = await student.save();

      return res.status(200).send({status: 'ok', msg: 'Success', student});

  } catch(e) {
      return res.status(500).send({status: 'error', msg: 'some error occurred', error: e.toString()});
  }
});

module.exports = router;