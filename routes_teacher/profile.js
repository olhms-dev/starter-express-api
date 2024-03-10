const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Staff = require('../models/staff');
const Student = require('../models/student');

dotenv.config();
const router = express.Router();

// endpoint to edit profile
router.post('/edit_profile', upload.single('staff-images'), async (req, res) => {
    const {token, phone_no2, country, middlename, gender, employment_year, class_name, religion, email, address, center, firstname, lastname, phone_no1, staff_id} = req.body;

    // check for required fields
    if(!token || !staff_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let staff = jwt.verify(token, process.env.JWT_SECRET);

        // upload profile picture        
        staff = await Staff.findById({_id: staff._id}).lean();
        let img_url = '';
        let img_id = '';
        if(req.file) {   
            if(staff.img_id != '') {
              await cloudinary.uploader.destroy(staff.img_id);    
            }    
            const result = await cloudinary.uploader.upload(req.file.path, {folder: 'staff-images'});
            console.log(result);
            img_url = result.secure_url;
            img_id = result.public_id;
        }
        
        // fetch and update document
        staff = await Staff.findByIdAndUpdate(
            {_id: staff_id},
            {
                class_name: class_name || staff.class_name,
                firstname: firstname || staff.firstname,
                lastname: lastname || staff.lastname,
                country: country || staff.country,
                phone_no2: phone_no2 || staff.phone_no2,
                middlename: middlename || staff.middlename,
                gender: gender || staff.gender,
                religion: religion || staff.religion,
                employment_year: employment_year || staff.employment_year,
                email: email || staff.email,
                phone_no: phone_no1 || staff.phone_no1,
                center: center || staff.center,
                address: address || staff.address,
                img_url: img_url || staff.img_url,
                img_id: img_id || staff.img_id
            },
            {new: true}
        ).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', staff});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view profile
router.post('/view_profile', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let staff = jwt.verify(token, process.env.JWT_SECRET);

        // fetch staff document
        staff = await Staff.findById({_id: staff._id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', staff});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to change password
router.post('/change_password_web', async (req, res) => {
    const { token, old_password, new_password } = req.body;

    // check for required fields
    if (!token || !old_password || !new_password)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });


    try {
        
        const staffToken = jwt.verify(token, process.env.JWT_SECRET);

            // check if staff account exists
        let staff = await Staff.findOne({ _id: staffToken._id }).lean();
        if (!staff)
            return res.status(400).send({ status: 'error', msg: `Staff with staff ID ${staffToken._id} not found` });
            
        if(await bcrypt.compare(old_password, staff.password)) {
            
            const password = await bcrypt.hash(new_password, 10);

            let staff = await Staff.findOneAndUpdate({ _id: staffToken._id }, {password}, { new: true }).lean();
            
            return res.status(200).send({status: 'ok', msg: 'Success', staff, token});
        } else {
            return res.status(400).send({status: 'error', msg: 'incorrect password'});
        }

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to fetch students in teachers's class
router.post('/students_list', async (req, res) => {
    const {token, class_name, center} = req.body;

    // check for required fields
    if(!token || !class_name || !center)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch students
        const students = await Student.find({class_name, center}).lean();

        if(students.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no students at the moment', count: 0, students: []});

        return res.status(200).send({status: 'ok', msg: 'success', count: students.length, students});

    } catch(e) {
        return res.status(500).send({status: 'error', msg: 'some error occurred', error: e.toString()});
    }
});

module.exports = router;