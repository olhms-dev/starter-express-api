const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const ContinousAssessment = require('../models/continous_assessment');
const AnswerSheet = require('../models/answer_sheet');
const Result = require('../models/result');
const Settings = require('../models/settings');

dotenv.config();
const router = express.Router();

// endpoint to view continous_assessment
router.post('/view_continous_assessment', async (req, res) => {
  const { token, continous_assessment_id } = req.body;

  // check for required fields
  if (!token || !continous_assessment_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch continous_assessment document
    const continous_assessment = await ContinousAssessment.findById({ _id: continous_assessment_id }).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', continous_assessment });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view current session continous_assessments
router.post('/view_current_session_continous_assessments', async (req, res) => {
  const { token, session, ca, class_name } = req.body;

  // check for required fields
  if (!token || !session || !ca || !class_name)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch continous_assessment document
    const continous_assessments = await ContinousAssessment.find({ is_deleted: false, is_completed: true, session, type: 'ca', ca, class_name }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if continous_assessments exist
    if (continous_assessments.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no continous_assessments at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', continous_assessments, count: continous_assessments.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view current term continous_assessments
router.post('/view_current_term_continous_assessments', async (req, res) => {
  const { token, session, ca, term, class_name, student_id } = req.body;

  // check for required fields
  if (!token || !session || !term || !ca || !class_name || !student_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    

    // fetch continous_assessment document
    const continous_assessments = await ContinousAssessment.find({ is_deleted: false, class_name, is_completed: true, session, term, type: 'ca', ca }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if continous_assessments exist
    if (continous_assessments.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no continous_assessments at the moment', count: 0, continous_assessments });

    //check if ca is active
    const settings = await Settings.findOne({doc_type: 'settings'}).lean();
  
    if(ca == 1){
      if(settings.first_ca_active != true){
        return res.status(200).send({ status: 'ok', msg: 'assessment_not_active', continous_assessments: [] });
      }
    }

    if(ca == 2){
      if(settings.second_ca_active != true){
        return res.status(200).send({ status: 'ok', msg: 'assessment_not_active', continous_assessments: [] });
      }
    }

    // check if student has written the ca
    continous_assessments.forEach((test) => {
      if (test.submissions_obj.length === 0 && test.submissions_theory.length === 0) {
        test.is_written_obj = false;
        test.is_written_theory = false;
      } else {
        test.is_written_obj = test.submissions_obj.some(submission => submission.student_id === student_id);
        test.is_written_theory = test.submissions_theory.some(submission => submission.student_id === student_id);
      }
      console.log(test.is_written_obj, test.is_written_theory);
    });

    return res.status(200).send({ status: 'ok', msg: 'success', continous_assessments, count: continous_assessments.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to submit continuous assessment
router.post('/submit_ca', async (req, res) => {
  const { token, subject, student_id, student_name, fullname, ca_id, ca, ca_date, ca_time, session, answers, class_name, term, section} = req.body;
  // the ca_id is the id of the continous assessment document

  // check for required fields
  if (!token || !student_id || !student_name || !fullname || !subject || !ca || !session || !term || !answers || !class_name || !section)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const timestamp = Date.now();

    // create a new answer sheet document and populate it
    let answer_sheet = new AnswerSheet;
    answer_sheet.student_id = student_id;
    answer_sheet.fullname = fullname;
    answer_sheet.subject = subject;
    answer_sheet.ca = ca;
    answer_sheet.session = session;
    answer_sheet.term = term;
    answer_sheet.answers = answers;
    answer_sheet.type = 'ca';
    answer_sheet.class_name = class_name;
    answer_sheet.ca_date = ca_date;
    answer_sheet.ca_time = ca_time;
    answer_sheet.timestamp = timestamp;
    answer_sheet.section = section;

    await answer_sheet.save();

    // fetch no of sections from the ca document
    const {no_of_sections} = await ContinousAssessment.findById({_id: ca_id}, {no_of_sections: 1}).lean();

    // fetch result document or create one if it doesn't exist for population
    let result = await Result.findOne({ student_id, session });

    if(no_of_sections == 1) {
      if (!result) {
        console.log("Stage One");
        result = new Result;
        result.student_id = student_id;
        result.student_name = fullname;
        result.teachers_id = '';
        result.class_name = class_name;
        result.session = session;
        result.validation_date = '';
        result.teachers_remark = '';
        result.is_repeated_by = '';
        result.is_promoted_by = '';
        result.term = term;
        result.timestamp = timestamp;
  
        let total_score = 0;
        let grade = 'Nil';
        let remark = 'Nil';
  
        // calculate the total score of the ca if section a was submitted
        if(section === 'a') {
          answers.forEach(answer => {
            if (answer.correct_answer === answer.student_answer) {
              total_score += answer.mark;
            }
          });
    
          // update the results document
          if (total_score === 100) {
            grade = "A";
            remark = "Distinction";
          } else if (total_score >= 70) {
            grade = "A";
            remark = "Excellent";
          } else if (total_score >= 60 && total_score <= 69) {
            grade = "B";
            remark = "Very Good";
          } else if (total_score >= 50 && total_score <= 59) {
            grade = "C";
            remark = "Good";
          } else if (total_score >= 40 && total_score <= 49) {
            grade = "D";
            remark = "Fair";
          } else if (total_score <= 39) {
            grade = "F";
            remark = "Fail";
          }
          if (ca === 1) {
            result.results = [{
              subject,
              first_ca_obj: total_score.toString(),
              total: total_score.toString(),
              grade, 
              remark
            }]
            // result.stage = 1;
          } else {
            result.results = [{
              subject,
              second_ca_obj: total_score.toString(),
              total: total_score.toString(),
              grade,
              remark
            }]
            // result.stage = 2;
          }
    
          result.total_score = total_score;
          // 1200 is the highest possible score a student can get which is used to calculate the average score
          result.average = (total_score / 1200 * 100 === Infinity) ? 0 : total_score / 1200 * 100;
          result.position = 0;
        }
  
        await result.save();
        
        // udpate the ca document conditionally
        if(section === "a") {
          // update objective
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_obj: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        } else {
          // update theory
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_theory: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        }
  
        return res.status(200).send({ status: 'ok', msg: 'success', answer_sheet });
      } else {
        let total_score = 0;
  
        // calculate total score of the ca
        answers.forEach(answer => {
          if (answer.correct_answer === answer.student_answer) {
            total_score += answer.mark;
          }
        });
  
        // update result document if section submitted was a
        if(section === "a") {
          let grade = 'Nil';
          let remark = 'Nil';
          for (let i = 0; i < result.results.length; i++) {
            if (result.results[i].subject === subject) {
              console.log("Stage two");
              // add the total score together
              let score = (result.results[i].total === 'Nil') ? total_score : Number.parseInt(result.results[i].total) + total_score;
              result.results[i].total = score.toString();
    
              if (total_score === 100) {
                grade = "A";
                remark = "Distinction";
              } else if (total_score >= 70) {
                grade = "A";
                remark = "Excellent";
              } else if (total_score >= 60 && total_score <= 69) {
                grade = "B";
                remark = "Very Good";
              } else if (total_score >= 50 && total_score <= 59) {
                grade = "C";
                remark = "Good";
              } else if (total_score >= 40 && total_score <= 49) {
                grade = "D";
                remark = "Fair";
              } else if (total_score <= 39) {
                grade = "F";
                remark = "Fail";
              }
    
              if (ca === 1) {
                result.results[i].first_ca_obj = total_score.toString();
                result.results[i].grade = grade;
                result.results[i].remark = remark;
                // result.stage = 1;
              } else {
                result.results[i].second_ca_obj = total_score.toString();
                result.results[i].grade = grade;
                result.results[i].remark = remark;
                // result.stage = 2;
              }
              result.total_score += total_score;
              // 1200 is the highest possible score a student can get which is used to calculate the average score
              result.average = (result.total_score / 1200 * 100 === Infinity) ? 0 : result.total_score / 1200 * 100;
            } else {
              console.log("Stage three");
              if (total_score === 100) {
                grade = "A";
                remark = "Distinction";
              } else if (total_score >= 70) {
                grade = "A";
                remark = "Excellent";
              } else if (total_score >= 60 && total_score <= 69) {
                grade = "B";
                remark = "Very Good";
              } else if (total_score >= 50 && total_score <= 59) {
                grade = "C";
                remark = "Good";
              } else if (total_score >= 40 && total_score <= 49) {
                grade = "D";
                remark = "Fair";
              } else if (total_score <= 39) {
                grade = "F";
                remark = "Fail";
              }
    
              if (ca === 1) {
                result.results.push({
                  subject,
                  first_ca_obj: total_score.toString(),
                  total: total_score.toString(),
                  grade,
                  remark
                });
                // result.stage = 1;
              } else {
                result.results.push({
                  subject,
                  second_ca_obj: total_score.toString(),
                  total: total_score.toString(),
                  grade,
                  remark
                });
                // result.stage = 2;
              }
    
              result.total_score = total_score;
              // 1200 is the highest possible score a student can get which is used to calculate the average score
              result.average = (result.total_score / 1200 * 100 === Infinity) ? 0 : result.total_score / 1200 * 100;
              result.position = 0;
    
            }
          }
        }
  
        await result.save();
  
        // udpate the ca document conditionally
        if(section === "a") {
          // update objective
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_obj: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        } else {
          // update theory
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_theory: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        }
        
        return res.status(200).send({ status: 'ok', msg: 'success', answer_sheet });
  
      }
    } else {
      if (!result) {
        console.log("Stage four");
        result = new Result;
        result.student_id = student_id;
        result.student_name = fullname;
        result.teachers_id = '';
        result.class_name = class_name;
        result.session = session;
        result.validation_date = '';
        result.teachers_remark = '';
        result.is_repeated_by = '';
        result.is_promoted_by = '';
        result.term = term;
        result.timestamp = timestamp;
  
        let total_score = 0;
        let grade = 'Nil';
        let remark = 'Nil';
  
        // calculate the total score of the ca
        answers.forEach(answer => {
          if (answer.correct_answer === answer.student_answer) {
            total_score += answer.mark;
          }
        });
  
        // update the results document if section submitted was a
        if(section === "a") {
          if (total_score === 100) {
            grade = "A";
            remark = "Distinction";
          } else if (total_score >= 70) {
            grade = "A";
            remark = "Excellent";
          } else if (total_score >= 60 && total_score <= 69) {
            grade = "B";
            remark = "Very Good";
          } else if (total_score >= 50 && total_score <= 59) {
            grade = "C";
            remark = "Good";
          } else if (total_score >= 40 && total_score <= 49) {
            grade = "D";
            remark = "Fair";
          } else if (total_score <= 39) {
            grade = "F";
            remark = "Fail";
          }
          if (ca === 1) {
            result.results = [{
              subject,
              first_ca_obj: total_score.toString(),
              total: total_score.toString(),
              grade,
              remark
            }]
            // result.stage = 1;
          } else {
            result.results = [{
              subject,
              second_ca_obj: total_score.toString(),
              total: total_score.toString(),
              grade,
              remark
            }]
            // result.stage = 2;
          }
    
          result.total_score = total_score;
          // 1200 is the highest possible score a student can get which is used to calculate the average score
          result.average = (total_score / 1200 * 100 === Infinity) ? 0 : total_score / 1200 * 100;
          result.position = 0;
        }

        await result.save();
        
        // udpate the ca document conditionally
        if(section === "a") {
          // update objective
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_obj: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        } else {
          // update theory
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_theory: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        }
  
        return res.status(200).send({ status: 'ok', msg: 'success', answer_sheet });
      } else {
        let total_score = 0;
  
        // calculate total score of the ca
        answers.forEach(answer => {
          if (answer.correct_answer === answer.student_answer) {
            total_score += answer.mark;
          }
        });
  
        // update result document if section submitted was a
        if(section === "a") {
          console.log("Stage five");
          let grade = 'Nil';
          let remark = 'Nil';
          for (let i = 0; i < result.results.length; i++) {
            if (result.results[i].subject === subject) {
              // add the total score together
              let score = (result.results[i].total === 'Nil') ? total_score : Number.parseInt(result.results[i].total) + total_score;
              result.results[i].total = score.toString();
    
              if (total_score === 100) {
                grade = "A";
                remark = "Distinction";
              } else if (total_score >= 70) {
                grade = "A";
                remark = "Excellent";
              } else if (total_score >= 60 && total_score <= 69) {
                grade = "B";
                remark = "Very Good";
              } else if (total_score >= 50 && total_score <= 59) {
                grade = "C";
                remark = "Good";
              } else if (total_score >= 40 && total_score <= 49) {
                grade = "D";
                remark = "Fair";
              } else if (total_score <= 39) {
                grade = "F";
                remark = "Fail";
              }
    
              if (ca === 1) {
                result.results[i].first_ca_obj = total_score.toString();
                result.results[i].grade = grade;
                result.results[i].remark = remark;
                // result.stage = 1;
              } else {
                result.results[i].second_ca_obj = total_score.toString();
                result.results[i].grade = grade;
                result.results[i].remark = remark;
                // result.stage = 2;
              }
              result.total_score += total_score;
              // 1200 is the highest possible score a student can get which is used to calculate the average score
              result.average = (result.total_score / 1200 * 100 === Infinity) ? 0 : result.total_score / 1200 * 100;
            } else {
              if (total_score === 100) {
                grade = "A";
                remark = "Distinction";
              } else if (total_score >= 70) {
                grade = "A";
                remark = "Excellent";
              } else if (total_score >= 60 && total_score <= 69) {
                grade = "B";
                remark = "Very Good";
              } else if (total_score >= 50 && total_score <= 59) {
                grade = "C";
                remark = "Good";
              } else if (total_score >= 40 && total_score <= 49) {
                grade = "D";
                remark = "Fair";
              } else if (total_score <= 39) {
                grade = "F";
                remark = "Fail";
              }
    
              if (ca === 1) {
                result.results.push({
                  subject,
                  first_ca_obj: total_score.toString(),
                  total: total_score.toString(),
                  grade,
                  remark
                });
                // result.stage = 1;
              } else {
                result.results.push({
                  subject,
                  second_ca_obj: total_score.toString(),
                  total: total_score.toString(),
                  grade,
                  remark
                });
                // result.stage = 2;
              }
    
              result.total_score = total_score;
              // 1200 is the highest possible score a student can get which is used to calculate the average score
              result.average = (result.total_score / 1200 * 100 === Infinity) ? 0 : result.total_score / 1200 * 100;
              result.position = 0;
    
            }
          }
        }  
        await result.save();
  
        // udpate the ca document conditionally
        if(section === "a") {
          // update objective
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_obj: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        } else {
          // update theory
          await ContinousAssessment.updateOne(
            { _id: ca_id }, 
            { $push: { submissions_theory: 
              { student_id, student_name, answer_sheet_id: answer_sheet._id, section, score: total_score} 
            }}
          ).lean();
        }
        
        return res.status(200).send({ status: 'ok', msg: 'success', answer_sheet });
  
      }
    }

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;