const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const AnswerSheet = require('../models/answer_sheet');

dotenv.config();
const router = express.Router();

// endpoint to validate answer_sheet
router.post('/validate_answer_sheet', upload.single('profile-pic'), async (req, res) => {
    const {token, teachers_name, answer_sheet_id} = req.body;

    // check for required fields
    if(!token || !answer_sheet_id || !teachers_name)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const teacher = jwt.verify(token, process.env.JWT_SECRET);

        let answer_sheet = await AnswerSheet.findByIdAndUpdate(
            {_id: answer_sheet_id},
            {
                is_validated: true,
                is_validated_by: teachers_name,
                validation_date: Date.now()
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'success', answer_sheet});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to edit answer_sheet
router.post('/edit_answer_sheet', upload.single('profile-pic'), async (req, res) => {
    const {token, attendance_score, affective_traits, psycho_motive_traits, answer_sheet_id, student_name, teachers_name, answer_sheets, term, teachers_remark, session, student_id, clas} = req.body;

    // check for required fields
    if(!token || !answer_sheet_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const teacher = jwt.verify(token, process.env.JWT_SECRET);
        
        // fetch and update document
        let answer_sheet = await AnswerSheet.findById({_id: answer_sheet_id}).lean();

        answer_sheet = await AnswerSheet.findByIdAndUpdate(
            {_id: answer_sheet_id},
            {
                answer_sheets: answer_sheets || answer_sheet.answer_sheets,
                student_name: student_name || answer_sheet.student_name,
                teachers_name: teachers_name || answer_sheet.teachers_name,
                term: term || answer_sheet.term,
                teachers_remark: teachers_remark || answer_sheet.teachers_remark,
                session: session || answer_sheet.session,
                attendance_score: attendance_score || answer_sheet.attendance_score,
                clas: clas || answer_sheet.clas,
                student_id: student_id || answer_sheet.student_id,
                affective_traits: affective_traits || answer_sheet.affective_traits,
                psycho_motive_traits: psycho_motive_traits || answer_sheet.psycho_motive_traits
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'success', answer_sheet});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view answer_sheet
router.post('/view_answer_sheet', async (req, res) => {
    const {token, answer_sheet_id} = req.body;

    // check for required fields
    if(!token || !answer_sheet_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch answer_sheet document
        const answer_sheet = await AnswerSheet.findById({_id: answer_sheet_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', answer_sheet});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// view answer_sheet based on term, subject, classname and section
router.post('/view_term_answer_sheet', async (req, res) => {
    const {token, session, term, class_name, subject, section} = req.body;

    // check for required fields
    if(!token || !session || !term || !class_name || !subject || !section)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch answer_sheet document
        const answer_sheet = await AnswerSheet.findOne({is_deleted: false, session, class_name, subject, section, term}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', answer_sheet});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view answer_sheets
router.post('/view_answer_sheets', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch answer_sheet document
        const answer_sheets = await AnswerSheet.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if answer_sheets exist
        if(answer_sheets.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no answer_sheets at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', answer_sheets, count: answer_sheets.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to delete answer_sheet
router.post('/delete_answer_sheet', async (req, res) => {
    const {token, answer_sheet_id} = req.body;

    // check for required fields
    if(!token || !answer_sheet_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch answer_sheet document
        await AnswerSheet.updateOne({_id: answer_sheet_id}, {is_deleted: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success'});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});


module.exports = router;