const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Staff = require('../models/staff');
const Statistics = require('../models/statistics');
const Admin = require('../models/admin');

dotenv.config();
const router = express.Router();

// endpoint to edit staff
router.post('/edit_staff', upload.single('staff-images'), async (req, res) => {
    const {token, phone_no2, country, state, gender, employment_year, class_name, religion, email, address, center, firstname, lastname, phone_no1, staff_id} = req.body;

    // check for required fields
    if(!token || !staff_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile picture        
        let staff = await Staff.findById({_id: staff_id}).lean();
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
                state: state || staff.state,
                gender: gender || staff.gender,
                religion: religion || staff.religion,
                employment_year: employment_year || staff.employment_year,
                email: email || staff.email,
                phone_no1: phone_no1 || staff.phone_no1,
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

// endpoint to view single staff
router.post('/view_single_staff', async (req, res) => {
    const {token, staff_id} = req.body;

    // check for required fields
    if(!token || !staff_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        // const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch staff document
        const staff = await Staff.findById({_id: staff_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', staff});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view staff
router.post('/view_multiple_staff', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
       jwt.verify(token, process.env.JWT_SECRET);

        // fetch staff document
        const staffs = await Staff.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if staffs exist
        if(staffs.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no staffs at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', staffs, count: staffs.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to search for staff
router.post('/search_staff', async (req, res) => {
    const {token, search_string, pagec} = req.body;

    if(!token || !search_string || search_string == '' || search_string == undefined){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }

    try{
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 1000;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        // exclude other fields in the document

        const staffs = await Staff.find({
            '$or': [
            {firstname: new RegExp(search_string, 'i')},
            {middlename: new RegExp(search_string, 'i')},
            {lastname: new RegExp(search_string, 'i')},
            {center: new RegExp(search_string, 'i')}
        ]})
        .sort({timestamp: "desc"})
        .limit(resultsPerPage)
        .skip(resultsPerPage * page)
        .lean();

        if(staffs.length === 0){
            return res.status(200).send({status: 'ok', msg: 'No staff found', count: staffs.length, staffs});
        }

        return res.status(200).send({status: 'ok', msg: 'Success', count: staffs.length, staffs});

    }catch (e){
        console.log(e);
        return res.status(400).send({status: 'error', msg: e});
    }

});

// endpoint to delete staff
router.post('/delete_staff', async (req, res) => {
    const {token, staff_id, staff_email} = req.body;

    // check for required fields
    if(!token || !staff_id || !staff_email)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET);

        // check if staff is a master staff
        let staffM = await Admin.findOne({ _id: admin._id, roles: 'master' }).lean();
        if (!staffM)
            return res.status(403).send({ stauts: 'error', msg: 'You are not allowed to carry out this operation, please contact master admin for more details' });

        // fetch staff document
        await Staff.updateOne({_id: staff_id}, {is_deleted: true, email: `${staff_email}_deleted_${Date.now()}`}).lean();

        await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_of_staff: -1}});

        return res.status(200).send({status: 'ok', msg: 'success'});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;