const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const StudentProgress = require('../models/student_progress');

dotenv.config();
const router = express.Router();

// endpoint to edit student_progress
router.post('/edit_student_progress', async (req, res) => {
    const {token, session, class_name, term, subjects, student_progress_id} = req.body;

    // check for required fields
    if(!token || !student_progress_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch and update document
        let student_progress = await StudentProgress.findById({_id: student_progress_id}).lean();
        student_progress = await StudentProgress.findByIdAndUpdate(
            {_id: student_progress_id},
            {
                class_name: class_name || student_progress.class_name,
                term: term || student_progress.term,
                subjects: subjects || student_progress.subjects,
                session: session || student_progress.session,
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'success', student_progress});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// // create student_progress
// router.post('/create_student_progress', async (req, res) => {
//     const {token, student_id, term, class_name, session, subjects} = req.body;

//     // check for required fields
//     if(!token || !term || !class_name || !subjects || !session || !studnet_id)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         jwt.verify(token, process.env.JWT_SECRET);
        
//         // create a new student_progress document and populate it
//         let student_progress = new StudentProgress;
//         student_progress.term = term;
//         student_progress.student_id = student_id;
//         student_progress.class_name = class_name;
//         student_progress.session = session;
//         student_progress.subjects = subjects;
//         student_progress.timestamp = Date.now();

//         await student_progress.save();

//         return res.status(200).send({status: 'ok', msg: 'success', student_progress});

//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// endpoint to view studens progress for a term
router.post('/view_student_progress', async (req, res) => {
    const {token, class_name, student_id, term, session} = req.body;

    // check for required fields
    if(!token || !class_name || !student_id || !term || !session)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch student_progress document
        const student_progress = await StudentProgress.findOne({is_deleted: false, student_id, term, session, class_name}, {is_deleted: 0, timestamp: 0}).lean();

        // check if student_progresss exist
        if(!student_progress)
          return res.status(200).send({status: 'ok', msg: 'no student_progresss for this term yet'});

        return res.status(200).send({status: 'ok', msg: 'success', student_progress});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;