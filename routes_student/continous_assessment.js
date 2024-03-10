const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const ContinousAssessment = require('../models/continous_assessment');
const Settings = require('../models/settings');
const Result = require('../models/result');

dotenv.config();
const router = express.Router();

// endpoint to view continous_assessment
router.post('/view_continous_assessment', async (req, res) => {
    const {token, continous_assessment_id} = req.body;

    // check for required fields
    if(!token || !continous_assessment_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch continous_assessment document
        const continous_assessment = await ContinousAssessment.findById({_id: continous_assessment_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', continous_assessment});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view continous_assessments
router.post('/view_continous_assessments', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

      // check if admin account exists
      // let admin = await Admin.findOne({ _id: adminToken._id }).lean();

        // fetch continous_assessment document
        const continous_assessments = await ContinousAssessment.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if continous_assessments exist
        if(continous_assessments.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no continous_assessments at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', continous_assessments, count: continous_assessments.length});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to submit assessment
router.post('/submit_assessment', async (req, res) => {
  const {token, continous_assessment_id, session, term, student_id, student_name, ca, section, subject, answers, score} = req.body;

  console.log(req.body);

  // check for required fields
  if(!token || !continous_assessment_id || !session || !term || !student_id || !student_name || !ca || !section || !subject || !answers)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      const settings = await Settings.findOne({doc_type: 'settings'}).lean();
      const level_one = settings.grading_system.level_one;
      const level_two = settings.grading_system.level_two;
      const level_three = settings.grading_system.level_three;
      const level_four = settings.grading_system.level_four;
      const level_five = settings.grading_system.level_five;

      const submission = {};
      const mResult = {
        first_ca: 0,
        second_ca: 0,
        exam: undefined,
        total: undefined,
        grade: undefined,
        remark: undefined
      };

      submission.student_name = student_name;
      submission.student_id = student_id;
      submission.section = section;
      submission.score = score || '';
      submission.answers = answers;
      submission.answer_sheet_id = '';

      if(ca == 1){
        mResult.subject = subject;
        mResult.first_ca = score;
      }

      if(ca == 2){
        mResult.subject = subject;
        mResult.second_ca = score;
      }

      if(ca == 3){

        // calculate total, grade and remark

        const pResult = await Result.findOne({student_id, session, term}).lean();
        let total;
        let remark;
        let grade;

        pResult.results.map(result =>{
          if(result.subject == subject){
            total = parseInt(result.first_ca) + parseInt(result.second_ca);
          }
        });
        
        // estimate the remark and grade
        
        if(level_one.score_range.includes('>=')){
          let lvVal = parseInt(level_one.split('=')[1].trim());
          if(total >= lvVal){
            remark = level_one.remark;
            grade = level_one.grade;
          }
        }

        if(level_five.score_range.includes('<=')){
          let lvVal = parseInt(level_five.split('=')[1].trim());
          if(total <= lvVal){
            remark = level_five.remark;
            grade = level_five.grade;
          }
        }

        if(level_two.score_range.includes('-')){
          let lvVala = parseInt(level_two.split('-')[0].trim());
          let lvValb = parseInt(level_two.split('-')[1].trim());

          if((total >= lvVala) && (total <= lvValb)){
            remark = level_two.remark;
            grade = level_two.grade;
          }
        }

        if(level_three.score_range.includes('-')){
          let lvVala = parseInt(level_three.split('-')[0].trim());
          let lvValb = parseInt(level_three.split('-')[1].trim());

          if((total >= lvVala) && (total <= lvValb)){
            remark = level_three.remark;
            grade = level_three.grade;
          }
        }

        if(level_four.score_range.includes('-')){
          let lvVala = parseInt(level_four.split('-')[0].trim());
          let lvValb = parseInt(level_four.split('-')[1].trim());

          if((total >= lvVala) && (total <= lvValb)){
            remark = level_four.remark;
            grade = level_four.grade;
          }
        }

        mResult.subject = subject;
        mResult.exam = score;
        mResult.total = total.toString();
        mResult.grade = grade;
        mResult.remark = remark;

      }
      
      let assessment;

      if(section == 'a'){
        assessment = await ContinousAssessment.findOneAndUpdate(
          {continous_assessment_id},
          {$push: {submissions_obj: submission}},
          {new: true}
        ).lean();
      }
      
      if(section == 'b' && (score == '' || score == undefined)){
        assessment = await ContinousAssessment.findOneAndUpdate(
          {continous_assessment_id, },
          {$push: {submissions_theory: submission}},
          {new: true}
        ).lean();
      }

      if(section == 'b' && (score != '' && score != undefined)){
        assessment = await ContinousAssessment.findOneAndUpdate(
          {continous_assessment_id, 'submissions_theory.student_id': student_id},
          {$set: {
            'submissions_theory.$.score': score
          }},
          {new: true}
        ).lean();
      }

      const found = await Result.findOne({student_id, session, term}).lean();
      let foundResult;

      found.results.map(result => {
        if(result.subject == subject){
          foundResult = result;
        }
      })

      let result;
      if(foundResult){

        result = await Result.findOneAndUpdate(
          {student_id, session, term, 'results.subject': subject},
          {
            'results.$.subject': subject,
            'results.$.exam': mResult.exam || foundResult.exam,
            'results.$.total': mResult.total || foundResult.total,
            'results.$.grade': mResult.grade || foundResult.grade,
            'results.$.remark': mResult.remark || foundResult.remark,
            $inc: {
              'results.$.first_ca': mResult.first_ca,
              'results.$.second_ca': mResult.second_ca
            }
          },
          {new: true}
        ).lean();

      }else{

        result = await Result.findOneAndUpdate(
          {student_id, session, term},
          {$push: {results: mResult}},
          {new: true}
        ).lean();

      }

      return res.status(200).send({status: 'ok', msg: 'Success', assessment, result});

  } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;