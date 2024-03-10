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

        return res.status(200).send({status: 'ok', msg: 'success', result});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// view result based on term
router.post('/view_term_result', async (req, res) => {
    const {token, session, term, class_name} = req.body;

    // check for required fields
    if(!token || !session || !term || !class_name)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const student = jwt.verify(token, process.env.JWT_SECRET);

        // fetch result document
        const result = await Result.findOne({is_deleted: false, class_name, session, term, student_id: student._id}).lean();

        // check if result for that term exist
        if(!result)
          return res.status(200).send({status: 'ok', msg: `no result for this session ${session} and term ${term}`});

        return res.status(200).send({status: 'ok', msg: 'success', result});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view results
router.post('/view_results', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const student = jwt.verify(token, process.env.JWT_SECRET);

        // fetch result document
        const results = await Result.find({is_deleted: false, student_id: student._id}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if results exist
        if(results.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no results at the moment', count: 0, results: []});

        return res.status(200).send({status: 'ok', msg: 'success', results, count: results.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to create result
router.post('/create_result', async (req, res) => {
  const {token, student_id, teachers_id, teachers_name, head_teachers_name} = req.body;

  // check for required fields
  if(!token || !student_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{

      const timestamp = Date.now();
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      const student = await Student.findOne({student_id}).lean();

      let result = new Result;
      result.student_id = student_id;
      result.student_name = student.fullname;
      result.student_img_url = student.img_url;
      result.teachers_id = teachers_id;
      result.teachers_name = teachers_name;
      result.head_teachers_name = head_teachers_name;
      result.class_name = student.class_name;
      result.session = student.current_session;
      result.term = student.current_term;
      result.is_validated = false;
      result.is_validated_by = '';
      result.validation_date = '';
      result.teachers_remark = '';
      result.verdict = '';
      result.head_teachers_remark = '';
      result.is_promoted_by = '';
      result.is_repeated_by = '';
      result.next_term_fee = 0;
      result.other_fees = 0;
      result.total_fees = 0;
      result.position = 0;
      result.total_score = 0;
      result.sum_total = '';
      result.string_total = '';
      result.average = 0;
      result.no_of_subjects_passed = 0;
      result.no_of_subjects_passed = 0;
      result.attendance_score = '';
      result.result_summary_remark;
      result.results = [];
      result.affective_traits = {
        general_conduct: '',
        assignments: '',
        class_participation: '',
        finishes_work_on_time: '',
        takes_care_of_materials: '',
        working_independently: ''
      };
      result.psycho_motive_traits = {
        regularity: '',
        personal_cleanliness: '',
        punctuality: '',
        completion_of_work: '',
        // disturbing_others: '',
        following_instructions: ''
      };
      result.timestamp = timestamp;
      result.is_deleted = false;
      result.center = student.center;
      result.overall_remark = '';

      result = await result.save();

      return res.status(200).send({status: 'ok', msg: 'success', result});

  } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to edit result object

module.exports = router;