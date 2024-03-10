const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Subject = require('../models/subject');
const StudentProgress = require('../models/student_progress');

dotenv.config();
const router = express.Router();

// endpoint to view subjects
router.post('/view_subjects', async (req, res) => {
  const { token, class_name, student_id, term, session } = req.body;

  // check for required fields
  if (!token || !class_name || !student_id || !term || !session)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subjects = await Subject.find({ is_deleted: false, class_name }).lean();

    // check if subjects exist
    if (subjects.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no subjects at the moment', count: 0, subjects: [] });

    // check if student progress exists
    let student_progress = await StudentProgress.findOne({ is_deleted: false, student_id, term, session, class_name }, { subjects: 1 });
    if (!student_progress) {
      const subjectsM = [];
      subjects.forEach(subject => {
        subjectsM.push({
          percentage: '0%',
          subject_name: subject.subject_name,
          current_week: 1
        });
        // edit subject array that will be returned
        subject.percentage = '0%';
        subject.current_week = 1;
      });

      // create student progress document
      student_progress = new StudentProgress;
      student_progress.student_id = student_id;
      student_progress.term = term;
      student_progress.class_name = class_name;
      student_progress.session = session;
      student_progress.subjects = subjectsM;
      student_progress.timestamp = Date.now();

      await student_progress.save();

      // remove lessons that are not for that term
      subjects.forEach(subject => {
        for (let i = subject.lessons.length - 1; i >= 0; i--) {
          if (subject.lessons[i].term !== term) {
            subject.lessons.splice(i, 1);
          }
        }
      });


      return res.status(200).send({ status: 'ok', msg: 'success_first', subjects, count: subjects.length, student_progress_id: student_progress._id });
    } else {
      //check if the subject exists in
      const allSubjectsExist = subjects.every(subj =>
        student_progress.subjects.some(item => item.subject_name === subj.subject_name)
      );

      if (!allSubjectsExist) {
        subjects.forEach(supersetItem => {
          if (!student_progress.subjects.some(subsetItem => subsetItem.subject_name === supersetItem.subject_name)) {
            student_progress.subjects.push({
              "percentage": "0%", // Add your default values here
              "subject_name": supersetItem.subject_name,
              "current_week": 1,
            });

            // subsetItem.percentage = '0%';
            // subsetItem.current_week = 1;
          }
        });
      }
      // // const subjectsN = [];
      // subjects.forEach(subject => {
      //   student_progress.subjects.forEach(s => {
      //     if(s.subject_name != subject.subject_name){
      //       student_progress.subjects.push({
      //         percentage: '0%',
      //         subject_name: subject.subject_name,
      //         current_week: 1
      //       });
      //       // edit subject array that will be returned
      //       subject.percentage = '0%';
      //       subject.current_week = 1;
      //     }
      //   })
      // });

      await student_progress.save();
      // edit subjects array that will be returned
      subjects.forEach(subject => {
        student_progress.subjects.forEach(progress => {
          if (subject.subject_name == progress.subject_name) {
            subject.percentage = progress.percentage;
            subject.current_week = progress.current_week;
          }
        });
      });

      // remove lessons that are not for that term
      subjects.forEach(subject => {
        for (let i = subject.lessons.length - 1; i >= 0; i--) {
          if (subject.lessons[i].term !== term) {
            subject.lessons.splice(i, 1);
          }
        }
      });
      
      return res.status(200).send({ status: 'ok', msg: 'success_second', subjects, count: subjects.length, student_progress_id: student_progress._id });
    }

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view subject
router.post('/view_subject', async (req, res) => {
  const { token, subject_id } = req.body;

  // check for required fields
  if (!token || !subject_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findById({ _id: subject_id }).lean();

    if (!subject)
      return res.status(403).send({ status: 'ok', msg: 'subject not found' })

    return res.status(200).send({ status: 'ok', msg: 'success', subject, });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;