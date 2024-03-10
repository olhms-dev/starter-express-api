const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passwordGenerator = require('generate-password');
const bcrypt = require('bcryptjs');

const Registration = require('../models/registration');
const Student = require('../models/student');
const Statistics = require('../models/statistics');
const Center = require('../models/center');

const {sendScheduleDateTime, sendLoginDetailsMail} = require('../utils/nodemailer');

dotenv.config();
const router = express.Router();

// endpoint to view new registrations
router.post('/new_registrations', async (req, res) => {
    const { token, pagec } = req.body;

    // check for required fields
    if (!token || !pagec)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 10;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        // fetch registration documents
        const reg_docs = await Registration.find(
            { new_registration: true, is_processed: false, is_admitted: false }
        ).sort({timestamp: "desc"}).limit(resultsPerPage).skip(resultsPerPage * page).lean();

        // check if registration documents exists
        if (reg_docs.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no new registration at the moment', count: 0, reg_docs: [] });

        return res.status(200).send({ status: 'ok', msg: 'success', reg_docs, count: reg_docs.length });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view processed applications
router.post('/processed_applications', async (req, res) => {
    const { token , pagec} = req.body;

    // check for required fields
    if (!token || !pagec)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 10;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        // fetch registration documents
        const reg_docs = await Registration.find(
            { new_registration: false, is_processed: true, is_admitted: false }
        ).sort({timestamp: "desc"}).limit(resultsPerPage).skip(resultsPerPage * page).lean();

        // check if registration documents exists
        if (reg_docs.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no processed registration at the moment', count: 0, reg_docs: [] });

        return res.status(200).send({ status: 'ok', msg: 'success', reg_docs, count: reg_docs.length });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view admitted students
router.post('/admitted_students', async (req, res) => {
    const { token, pagec } = req.body;

    // check for required fields
    if (!token || !pagec)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 10;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        // fetch registration documents
        const reg_docs = await Registration.find(
            { new_registration: false, is_processed: true, is_admitted: true },
            { firstname: 1, lastname: 1, guardian_info: 1, timestamp: 1 }
        ).sort({timestamp: "desc"}).limit(resultsPerPage).skip(resultsPerPage * page).lean();

        // check if registration documents exists
        if (reg_docs.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no admitted students at the moment', count: 0, reg_docs: [] });

        return res.status(200).send({ status: 'ok', msg: 'success', reg_docs, count: reg_docs.length });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view single registration
router.post('/view_registration', async (req, res) => {
    const { token, reg_doc_id } = req.body;

    // check for required fields
    if (!token || !reg_doc_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch registration document
        const reg_doc = await Registration.findById({ _id: reg_doc_id }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success', reg_doc });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to set interview date and time for student
router.post('/set_interview_date_time', async (req, res) => {
    const { token, interview_date, interview_time, reg_doc_id, rescheduled} = req.body;

    // check for required fields
    if (!token || !interview_date || !interview_time || !reg_doc_id || rescheduled === null || rescheduled === undefined)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // udpate registration document
        const reg_doc = await Registration.findByIdAndUpdate({ _id: reg_doc_id }, { interview_date, interview_time, is_processed: true, new_registration: false }, { new: true }).lean();

        // send mail to applicant
        sendScheduleDateTime({interview_date, interview_time}, {email: reg_doc.guardian_info.email, fullname: reg_doc.fullname}, rescheduled)

        return res.status(200).send({ status: 'ok', msg: 'success', reg_doc });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to admit a student
router.post('/admit_student', async (req, res) => {
    const { token, reg_doc_id, center, current_session, current_term } = req.body;

    // check for required fields
    if (!token || !reg_doc_id || !center || !current_session || !current_term)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // udpate registration document
        const reg_doc = await Registration.findByIdAndUpdate({ _id: reg_doc_id }, { center, is_admitted: true, is_processed: true, new_registration: false }, { new: true }).lean();

        //generate student password and encrypt it
        const passwordM = passwordGenerator.generate({ length: 6, numbers: true });
        const password = await bcrypt.hash(passwordM, 10);

        // create student document
        let student = new Student;
        student.student_id = reg_doc.student_id;
        student.fullname = reg_doc.fullname;
        student.middlename = reg_doc.middlename;
        student.address = reg_doc.address;
        student.religion = reg_doc.religion;
        student.lastname = reg_doc.lastname;
        student.academic_details = reg_doc.academic_details;
        student.firstname = reg_doc.firstname;
        student.emergency_info = reg_doc.emergency_info;
        student.password = password;
        student.guardian_info = reg_doc.guardian_info;
        student.class_name = reg_doc.class_name;
        student.date_of_birth = reg_doc.date_of_birth;
        student.place_of_birth = reg_doc.place_of_birth;
        student.gender = reg_doc.gender;
        student.special_needs = reg_doc.special_needs;
        student.country = reg_doc.nationality;
        student.current_session = current_session;
        student.current_term = current_term;
        student.health_matters = reg_doc.health_matters || {};
        student.login_code = "not set";
        student.img_url = reg_doc.img_url || '';
        student.img_id = reg_doc.img_id || '';
        student.center = center;
        student.timestamp = Date.now();
        student.addmission_year = current_session;

        student = await student.save();

        // await FsStudent.doc(student._id.toString()).set({
        //     _id: student._id.toString(),
        //     token: "",
        //     channel_name: "",
        //     fullname: reg_doc.fullname,
        //     img_url: reg_doc.img_url || '',
        //     designation: "user",
        //     is_deleted: false,
        //     is_blocked: false,
        //   });

        const login_details = {
            email: reg_doc.guardian_info.email,
            student_id: student.student_id,
            password: passwordM,
            login_code: student.login_code
        }

        // send mail to student

        // update statistics document
        await Statistics.updateOne({ doc_type: 'statistics' }, { $inc: { no_of_students: 1 } }, { upsert: true }).lean();

        // update center document conditionally
        if (reg_doc.class_name === 'Creche') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'babies_and_toddlers.no_of_creche': 1,
                    'babies_and_toddlers.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Toddlers') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'babies_and_toddlers.no_of_toddlers': 1,
                    'babies_and_toddlers.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Infant Community 1') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'infant_school.infant_community_one': 1,
                    'infant_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Infant Community 2') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'infant_school.infant_community_two': 1,
                    'infant_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Nursery 1') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'infant_school.nursery_one': 1,
                    'infant_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Nursery 2') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'infant_school.nursery_two': 1,
                    'infant_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Grade 1') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'grade_school.grade_one': 1,
                    'grade_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Grade 2') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'grade_school.grade_two': 1,
                    'grade_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Grade 3') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'grade_school.grade_three': 1,
                    'grade_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Grade 4') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'grade_school.grade_four': 1,
                    'grade_school.total': 1
                }
            }).lean()
        } else if (reg_doc.class_name === 'Grade 5') {
            await Center.updateOne({ center_name: center }, {
                $inc: {
                    no_of_students: 1,
                    'grade_school.grade_five': 1,
                    'grade_school.total': 1
                }
            }).lean()
        }

        return res.status(200).send({ status: 'ok', msg: 'success', student, login_details });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to send email to student containing their login details
router.post('/send_login_details_mail', async (req, res) => {
    const { token, student_name, email, student_id, password} = req.body;

    // check for required fields
    if (!token || !student_name || !email || !student_id || !password)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // send mail to applicant
        sendLoginDetailsMail(student_name, email, student_id, password);

        return res.status(200).send({ status: 'ok', msg: 'success'});

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to search for new registrations
router.post('/search_new_registrations', async (req, res) => {
    const {token, search_string, pagec} = req.body;
  
    // check for required fields
    if(!token || !pagec || !search_string)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      const resultsPerPage = 10;
      let page = pagec >= 1 ? pagec : 1;
      page = page -1;
  
      // fetch registration documents
      const reg_docs = await Registration.find({
        is_deleted: false, new_registration: true, is_processed: false, is_admitted: false,
        $or: [
        { fullname: new RegExp(search_string, 'i') },
        { firstname: new RegExp(search_string, 'i') },
        { middlename: new RegExp(search_string, 'i')},
        { lastname: new RegExp(search_string, 'i') },
        { application_date: new RegExp(search_string, 'i') },
        { 'guardian_info.email': new RegExp(search_string, 'i') },
        { 'guardian_info.phone_no': new RegExp(search_string, 'i') }
        ]}
      )
      .skip(resultsPerPage * page)
      .limit(resultsPerPage)
      .sort({timestamp: 'desc'})
      .lean();
  
      // check if reg_docs where found
      if(reg_docs.length === 0)
        return res.status(200).send({status: 'ok', msg: 'no new registrations found', count: 0});
    
      return res.status(200).send({status: 'ok', msg: 'success', reg_docs , count: reg_docs.length});
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to search for processed applications
router.post('/search_processed_registrations', async (req, res) => {
    const {token, search_string, pagec} = req.body;
  
    // check for required fields
    if(!token || !pagec || !search_string)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
  
    try{
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      const resultsPerPage = 10;
      let page = pagec >= 1 ? pagec : 1;
      page = page -1;
  
      // fetch registration documents
      const reg_docs = await Registration.find({
        is_deleted: false, new_registration: false, is_processed: true, is_admitted: false,
        $or: [
        { fullname: new RegExp(search_string, 'i') },
        { firstname: new RegExp(search_string, 'i') },
        { middlename: new RegExp(search_string, 'i')},
        { lastname: new RegExp(search_string, 'i') },
        { application_date: new RegExp(search_string, 'i') },
        { 'guardian_info.email': new RegExp(search_string, 'i') },
        { 'guardian_info.phone_no': new RegExp(search_string, 'i') }
        ]}
      )
      .skip(resultsPerPage * page)
      .limit(resultsPerPage)
      .sort({timestamp: 'desc'})
      .lean();
  
      // check if reg_docs where found
      if(reg_docs.length === 0)
        return res.status(200).send({status: 'ok', msg: 'no processed registrations found', count: 0});
    
      return res.status(200).send({status: 'ok', msg: 'success', reg_docs , count: reg_docs.length});
  
    } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;