const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Faqs = require('../models/faqs');

dotenv.config();
const router = express.Router();

// create faqs
router.post('/create_faqs', async (req, res) => {
    const {token, question, answer} = req.body;

    // check for required fields
    if(!token || !question || !answer)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // create a new faqs document and populate it
        let faqs = new Faqs;
        faqs.question = question;
        faqs.answer = answer;
        faqs.timestamp = Date.now();

        await faqs.save();

        return res.status(200).send({status: 'ok', msg: 'success', faqs});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to edit faqs
router.post('/edit_faqs', async (req, res) => {
    const {token, answer, question, faqs_id} = req.body;

    // check for required fields
    if(!token || !faqs_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);
        
        // fetch and update document
        let faqs = await Faqs.findById({_id: faqs_id}).lean();

        faqs = await Faqs.findByIdAndUpdate(
            {_id: faqs_id},
            {
                answer: answer || faqs.answer,
                question: question || faqs.question
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'success', faqs});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view faqs
router.post('/view_single_faqs', async (req, res) => {
    const {faqs_id} = req.body;

    // check for required fields
    if(!faqs_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // fetch faqs document
        const faqs = await Faqs.findById({_id: faqs_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', faqs});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view multiple faqs
router.post('/view_multiple_faqss', async (req, res) => {
    try{
        // fetch faqs documents
        const faqs = await Faqs.find({is_deleted: false}, {is_deleted: 0, timestamp: 0}).lean();

        // check if faqss exist
        if(faqs.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no faqss at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', faqs, count: faqs.length});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to delete faqs
router.post('/delete_faqs', async (req, res) => {
    const {token, faqs_id} = req.body;

    // check for required fields
    if(!token || !faqs_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch faqs document
        await Faqs.updateOne({_id: faqs_id}, {is_deleted: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success'});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;