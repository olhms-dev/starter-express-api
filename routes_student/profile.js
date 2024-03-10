const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Student = require('../models/student');

dotenv.config();
const router = express.Router();

// endpoint to veiw student profile
router.post('/view_student_profile', async (req, res) => {
  const {token} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    const studentM = jwt.verify(token, process.env.JWT_SECRET);

    // fetch student document
    const student = await Student.findById({_id: studentM._id}).lean();
    console.log(student);

    // check if student documents exist
    if(!student)
      return res.status(200).send({status: 'ok', msg: 'no student found'});

    return res.status(200).send({status: 'ok', msg: 'success', student});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to edit student profile
router.post('/edit_student_profile', async (req, res) => {
  const {token, permanent_address, country, parent_phone, parent_email} = req.body;

  // check for required fields
  if(!token)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    const studentM = jwt.verify(token, process.env.JWT_SECRET);

    // fetch student document
    let student = await Student.findById({_id: studentM._id}).lean();

    // check if student documents exist
    if(!student)
      return res.status(200).send({status: 'ok', msg: `No student with id: ${studentM._id} found`});

    student = await Student.findOneAndUpdate({_id: studentM._id}, {
      country: country || student.country,
      'guardian_info.address': permanent_address || student.guardian_info.address,
      'guardian_info.phone_no': parent_phone || student.guardian_info.phone_no,
      'guardian_info.email': parent_email || student.guardian_info.email
    }, {new: true}).lean();

    return res.status(200).send({status: 'ok', msg: 'success', student});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});


module.exports = router;