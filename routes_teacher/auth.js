const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const Staff = require('../models/staff');
const Session = require('../models/session');

dotenv.config();
const router = express.Router();

// endpoint to login
router.post('/login',  async (req, res) => {
    const {password, email} = req.body;

    // check for required fields
    if(!email || !password)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // check if document exists
        const staff = await Staff.findOneAndUpdate({email}, {is_online: true}, {new: true}).lean();
        console.log(staff);
        if(!staff)
          return res.status(400).send({status: 'error', msg: 'account not found'});

        if(await bcrypt.compare(password, staff.password)) {
            // generate token
            const token = jwt.sign({
                _id: staff._id,
                email: staff.email
            }, process.env.JWT_SECRET);

            delete staff.password;

            // fetch session document
            const current_session = await Session.findOne({is_deleted: false, current_session: true}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();        
    
            return res.status(200).send({status: 'ok', msg: 'Success', staff, current_session, token});
        } else {
            return res.status(400).send({status: 'error', msg: 'incorrect password'});
        }
 

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to logout
router.post('/logout', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let staff = jwt.verify(token, process.env.JWT_SECRET);

        // check if document exists
        staff = await Staff.findByIdAndUpdate({_id: staff._id}, {$set: {is_online: false, last_logn: Date.now()}}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', staff});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;