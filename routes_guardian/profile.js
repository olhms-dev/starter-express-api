const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Guardian = require('../models/guardian');
const Student = require('../models/student');
// const Admin = require('../models/admin');

dotenv.config();
const router = express.Router();


// endpoint to view guardian
router.post('/view_profile', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let guardian = jwt.verify(token, process.env.JWT_SECRET);

        // fetch guardian document
        guardian = await Guardian.findById({_id: guardian._id}).lean();

        // fetch children documents under guardian
        const students = await Student.find({guardian_id: guardian._id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', guardian, students});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// edit profile
router.post('/edit_profile', upload.array('kids-images'), async (req, res) => {
    const {token, fullname, email, phone_no, children} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let guradian = jwt.verify(token, process.env.JWT_SECRET);
        
        // fetch and update document
        guardian = await Guardian.findByIdAndUpdate(
            {_id: guradian._id},
            {
                fullname: fullname || guardian.fullname,
                email: email || guardian.email,
                phone_no: phone_no || guardian.phone_no,
                children: children || guardian.children
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', guardian});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});


module.exports = router;