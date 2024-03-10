const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Request = require('../models/request');

dotenv.config();
const router = express.Router();

// endpoint to request for a product
router.post('/create_request', async (req, res) => {
    const {token, student_id, email, phone_no, addmission_year, session, term, products} = req.body;

    // check for required fields
    if(!token || !student_id || !email || !phone_no || !addmission_year || !session || !term || !products)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);
        
        // create a new product document and populate it
        let request = new Request;
        request.student_id = student_id;
        request.email = email;
        request.phone_no = phone_no;
        request.addmission_year = addmission_year;
        request.session = session;
        request.term = term;
        request.products = products;
        request.timestamp = Date.now();

        await request.save();

        return res.status(200).send({status: 'ok', msg: 'success', request});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;