const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Result = require('../models/result');
const Student = require('../models/student');

dotenv.config();
const router = express.Router();

// endpoint to view result
router.post('/view_result', async (req, res) => {
    const {token, result_id} = req.body;
  
    // check for required fields
    if(!token || !result_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // fetch result document
      const result = await Result.findById({_id: result_id}).lean();
  
      if(!result)
        return res.status(200).send({status: 'ok', msg: 'result not found'})
  
      return res.status(200).send({status: 'ok', msg: 'success', result,});
  
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
  });

  // endpoint to view session result
router.post('/view_session_result', async (req, res) => {
    const {token, session, student_id} = req.body;
  
    // check for required fields
    if(!token || !session || !student_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // fetch result document
      const results = await Result.find({session, student_id, is_validated: true}).lean();
  
      if(results.length === 0)
        return res.status(200).send({status: 'ok', msg: `results not found for session ${session}`})
  
      return res.status(200).send({status: 'ok', msg: 'success', result,});
  
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
  });
  
// view result based on term
router.post('/view_term_result', async (req, res) => {
    const {token, session, term} = req.body;

    // check for required fields
    if(!token || !session || !term)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch result document
        const result = await Result.findOne({is_deleted: false, session, term}).lean();

        if(!result)
            return res.status(200).send({status: 'ok', msg: `result not found for this term ${term}`})
  
        return res.status(200).send({status: 'ok', msg: 'success', result});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

  // endpoint to view all results for a student
router.post('/view_all_results', async (req, res) => {
    const {token, student_id} = req.body;
  
    // check for required fields
    if(!token || !student_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // fetch result document
      const results = await Result.find({student_id}).lean();
  
      if(results.length <= 0)
        return res.status(200).send({status: 'ok', msg: 'no result found for this student', count: 0, results: []});
  
      return res.status(200).send({status: 'ok', msg: 'success', results, count: results.length});
  
  
    } catch(e) {
      return res.status(500).send({status: 'error', msg: 'some error occurred', error: e.toString()});
    }
  });

  // NEW ENDPOINTS FOR RESULTS

// endpoint specific student result score
router.post('/view_student_result_scores', async (req, res) => {
  const {token, student_id, session, term, class_name} = req.body;

  // check for required fields
  if(!token || !student_id ||!session || !term || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
      // verify token
      const Admin = jwt.verify(token, process.env.JWT_SECRET);

      let student_center = await Student.findOne({student_id}).select(["center"]).lean();

      student_center = student_center.center;

      // fetch result document
      const results = await Result.find({is_deleted: false, student_id, session, term, class_name, center: student_center}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

      // check if results exist
      if(results.length === 0)
        return res.status(200).send({status: 'ok', msg: 'no results at the moment', count: 0, results: []});

      return res.status(200).send({status: 'ok', msg: 'success', results, count: results.length});

  } catch(e) {
      return res.status(500).send({status: 'error', msg: 'some error occurred', error: e.toString()});
  }
});

  module.exports = router;