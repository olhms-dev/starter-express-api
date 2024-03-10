const express = require('express');
const dotenv = require('dotenv');
const Faqs = require('../models/faqs');

dotenv.config();
const router = express.Router();

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

module.exports = router;