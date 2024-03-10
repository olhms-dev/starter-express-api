const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Statistics = require('../models/statistics');

dotenv.config();
const router = express.Router();

// endpoint to view statistics
router.post('/view_statistics', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch statistics document
        const statistics = await Statistics.findOne({doc_type: 'statistics'}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', statistics});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;