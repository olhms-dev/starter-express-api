const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passwordGenerator = require('generate-password');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Admin = require('../models/admin');
const Staff = require('../models/staff');
const AdminIds = require('../models/admin_ids');
const Statistics = require('../models/statistics');
const Center = require('../models/center');
const GradingSystem = require('../models/grading_system');
const Conversation = require('../models/conversation');
const ContinousAssessment = require('../models/continous_assessment');

dotenv.config();
const router = express.Router();

const {
  FsAdmin,
  FieldValue,
} = require("../services/firebase_service_config");

// login to settings
router.post('/settings_login', upload.single('admin-images'), async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    // check if document exists
    const adminM = await Admin.findOne({ _id: admin._id, roles: 'master' }).lean();

    if (!adminM)
      return res.status(400).send({ status: 'error', msg: 'account not a master admin account' });

    return res.status(200).send({ status: 'ok', msg: 'Success' });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});


// endpoint to add an admin
router.post('/add_admin', upload.single('admin-images'), async (req, res) => {
  const { token, firstname, lastname, email, phone_no1, phone_no2, address, state, country, religion, gender, center, roles, employment_year } = req.body;

  // check for required fields
  if (!firstname || !lastname || !phone_no1 || !email || !state || !address || !country || !religion || !gender || !roles || !center || !employment_year)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    //jwt.verify(token, process.env.JWT_SECRET);

    // check if admin account exists
    let admin = await Admin.findOne({ email }, { email: 1 }).lean();
    if (admin)
      return res.status(400).send({ status: 'error', msg: `admin with email: ${email} or phone_no: ${phone_no1} already exists` })

    // upload file
    let img_url = '';
    let img_id = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'admin images', quality: 'auto', fetch_format: "auto" });
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // generate password
    const password = passwordGenerator.generate({ length: 6, numbers: true });
    const passwordM = await bcrypt.hash(password, 10);

    const timestamp = Date.now();

    // create a new admin document
    admin = new Admin;
    admin.firstname = firstname;
    admin.lastname = lastname;
    admin.email = email;
    admin.staff_id = timestamp;
    admin.phone_no1 = phone_no1;
    admin.phone_no2 = phone_no2 || '';
    admin.password = passwordM;
    admin.address = address;
    admin.country = country;
    admin.state = state;
    admin.religion = religion;
    admin.gender = gender;
    admin.center = center;
    admin.roles = roles;
    admin.employment_year = employment_year;
    admin.img_url = img_url || '';
    admin.img_id = img_id || '';
    admin.timestamp = timestamp;

    admin = await admin.save();

    await FsAdmin.doc(admin._id.toString()).set({
      _id: admin._id.toString(),
      token: "",
      channel_name: "",
      fullname: `${firstname} ${lastname}`,
      img_url: img_url || 'a',
      designation: "admin",
      is_deleted: false,
      is_blocked: false
    });

    // check if admin role is help_feedback or master and update admin_id docment
    if (admin.roles.some(element => element === 'master' || 'help_feedback')) {
      await AdminIds.updateOne(
        { doc_type: 'admin_ids' },
        {
          '$push': { 'ids': admin._id },
          '$inc': { 'count': 1 }
        },
        { upsert: true }
      ).lean();

    }

    // update statistics document
    await Statistics.updateOne({ doc_type: 'statistics' }, { $inc: { no_of_admins: 1 } }, { upsert: true }).lean();

    return res.status(200).send({ status: 'ok', msg: 'success', admin, login_details: { email, password, staff_id: timestamp } });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// add staff
router.post('/add_staff', upload.single('staff-images'), async (req, res) => {
  const { token, firstname, middlename, lastname, email, phone_no1, phone_no2, address, country, religion, gender, center, class_name, role, employment_year } = req.body;

  // check for required fields
  if (!token || !firstname || !email || !middlename || !lastname || !phone_no1 || !address || !country || !religion || !gender || !role || !center || !employment_year)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // check if staff account exists
    let staff = await Staff.findOne({ email }, { email: 1 }).lean();
    if (staff)
      return res.status(400).send({ status: 'error', msg: `guaradian with email: ${email} or phone_no: ${phone_no1} already exists` })

    // upload file
    let img_url = '';
    let img_id = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'staff images', quality: 'auto', fetch_format: "auto" });
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    let password = '';
    let passwordM = '';
    password = passwordGenerator.generate({ length: 6, numbers: true });
    passwordM = await bcrypt.hash(password, 10);

    const timestamp = Date.now();

    // create a new staff document
    staff = new Staff;
    staff.firstname = firstname;
    staff.middlename = middlename;
    staff.lastname = lastname;
    staff.email = email;
    staff.staff_id = timestamp;
    staff.phone_no1 = phone_no1;
    staff.phone_no2 = phone_no2 || '';
    staff.password = passwordM;
    staff.address = address;
    staff.country = country;
    staff.religion = religion;
    staff.gender = gender;
    staff.center = center;
    staff.class_name = class_name || '';
    staff.role = role;
    staff.employment_year = employment_year;
    staff.img_url = img_url || '';
    staff.img_id = img_id || '';
    staff.timestamp = timestamp;

    await staff.save();

    // send email

    // update statistics document
    await Statistics.updateOne({ doc_type: 'statistics' }, { $inc: { no_of_staff: 1 } }, { upsert: true }).lean();

    // update center document
    await Center.updateOne({ center_name: center }, { $inc: { no_of_staff: 1 } }).lean()

    return res.status(200).send({ status: 'ok', msg: 'success', staff, login_details: { email, password, staff_id: timestamp } });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to edit admin
router.post('/edit_admin', upload.single('admin-images'), async (req, res) => {
  const { token, phone_no1, phone_no2, country, gender, center, religion, address, email, roles, firstname, lastname, admin_id } = req.body;

  // check for required fields
  if (!token || !admin_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    const admin_user = jwt.verify(token, process.env.JWT_SECRET);

    // check if admin is a master admin
    let adminM = await Admin.findOne({ _id: admin_id, role: 'master' }).lean();
    if (!adminM)
      return res.status(403).send({ stauts: 'error', msg: 'You are not allowed to carry out this operation, contact master admin for more details' });

    // upload profile picture        
    let admin = await Admin.findById({ _id: admin_id }).lean();
    let img_url = '';
    let img_id = '';
    if (req.file) {
      if (admin.img_id != '') {
        await cloudinary.uploader.destroy(admin.img_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'admin-images' });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // fetch and update document
    admin = await Admin.findByIdAndUpdate(
      { _id: admin_id },
      {
        role: roles || admin.roles,
        firstname: firstname || admin.firstname,
        lastname: lastname || admin.lastname,
        email: email || admin.email,
        phone_no1: phone_no1 || admin.phone_no1,
        phone_no2: phone_no2 || admin.phone_no2,
        gender: gender || admin.gender,
        religion: religion || admin.religion,
        country: country || admin.country,
        center: center || admin.center,
        address: address || admin.address
      },
      { new: true }
    ).lean();

  //   if(admin.role.some(element => element === 'Agents Support' || 'Users Customer care')) {
  //     console.log('got here');
  //     await AdminIds.updateOne(
  //         {doc_type: 'admin_ids'},
  //         {
  //             '$push': {'ids': admin._id},
  //             '$inc': {'count': 1}
  //         },
  //         {upsert: true}
  //     ).lean();

  //     // check if conversations have been made before and update documents
  //     const convers = Conversation.find({doc_type: 'conversations'}).select(['members']).lean();
  //     if(convers) {
  //         // update mongodb document
  //         await Conversation.updateMany(
  //             {doc_type: 'conversations', conv_type: 'help_feedback'},
  //             {'$push': {members: admin._id}}
  //         ).lean();

  //         // update firebase document
  //         const conversations = await FsConversation.get();
  //         const batches = _.chunk(conversations.docs, 500).map(conversationDocs => {
  //             const batch = db.batch()
  //             conversationDocs.forEach(doc => {
  //                 batch.set(doc.ref, {
  //                     members: FieldValue.arrayUnion(admin._id.toString())
  //                 }, { merge: true })
  //             })
  //             return batch.commit()
  //         })
  //         await Promise.all(batches)
  //     }
  // }

    return res.status(200).send({ status: 'ok', msg: 'Success', admin });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view admin
router.post('/view_admin', async (req, res) => {
  const { token, admin_id } = req.body;

  // check for required fields
  if (!token || !admin_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    const mAdmin = jwt.verify(token, process.env.JWT_SECRET);

    // check if admin is a master admin
    let adminM = await Admin.findOne({ _id: mAdmin._id, role: 'master' }).lean();
    if (!adminM)
      return res.status(403).send({ stauts: 'error', msg: 'You are not allowed to carry out this operation, contact master admin for more details' });

    // fetch admin document
    const admin = await Admin.findById({ _id: admin_id }).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', admin });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view admins
router.post('/view_admins', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    // check if admin is a master admin
    let adminM = await Admin.findOne({ _id: admin._id, role: 'master' }).lean();
    if (!adminM)
      return res.status(403).send({ stauts: 'error', msg: 'You are not allowed to carry out this operation, contact master admin for more details' });

    // fetch admin document
    const admins = await Admin.find({ is_deleted: false }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if admins exist
    if (admins.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no admins at the moment', count: 0, admins: [] });

    return res.status(200).send({ status: 'ok', msg: 'success', admins, count: admins.length });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to search admins
router.post('/search_admins', async (req, res) => {
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

      const admins = await Admin.find({
          '$or': [
          {firstname: new RegExp(search_string, 'i')},
          {lastname: new RegExp(search_string, 'i')},
          {center: new RegExp(search_string, 'i')}
      ]})
      .sort({timestamp: "desc"})
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

      if(admins.length === 0){
          return res.status(200).send({status: 'ok', msg: 'No admins found', count: admins.length, admins});
      }

      return res.status(200).send({status: 'ok', msg: 'Success', count: admins.length, admins});

  }catch (e){
      console.log(e);
      return res.status(400).send({status: 'error', msg: e});
  }

});

// endpoint to delete admin
router.post('/delete_admin', async (req, res) => {
  const { token, admin_id } = req.body;

  // check for required fields
  if (!token || !admin_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    // check if admin is a master admin
    let adminM = await Admin.findOne({ _id: admin._id, roles: 'master' }).lean();
    if (!adminM)
      return res.status(403).send({ stauts: 'error', msg: 'You are not allowed to carry out this operation, contact master admin for more details' });

    // fetch admin document
    await Admin.updateOne({ _id: admin_id }, { is_deleted: true }).lean();

    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_of_admins: -1}});

    return res.status(200).send({ status: 'ok', msg: 'success' });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to create grading system
router.post('/create_grading_system', upload.single('admin-images'), async (req, res) => {
  const { token, excellent, very_good, good, fair, fail } = req.body;

  // check for required fields
  if (!token || !excellent || !very_good || !good || !fair || !fail)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // create a new admin document
    let grading_system = new GradingSystem;
    grading_system.excellent = excellent;
    grading_system.very_good = very_good;
    grading_system.fail = fail;
    grading_system.staff_id = timestamp;
    grading_system.good = good;
    grading_system.fair = fair;
    grading_system.timestamp = Date.now();

    await grading_system.save();

    return res.status(200).send({ status: 'ok', msg: 'success', grading_system });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to edit grading system
router.post('/edit_grading_system', upload.single('admin-images'), async (req, res) => {
  const { token, grading_system_id, excellent, very_good, good, fair, fail } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch grading system document
    let grading_system = await GradingSystem.findById({ doc_type: 'grading system' }).lean();

    // edit grading system document
    grading_system = await GradingSystem.findByIdAndUpdate(
      { _id: grading_system_id },
      {
        excellent: excellent || grading_system.excellent,
        very_good: very_good || grading_system.very_good,
        good: good || grading_system.good,
        fair: fair || grading_system.fair,
        fail: fail || grading_system.fail
      },
      { new: true }
    ).lean();

    await grading_system.save();

    return res.status(200).send({ status: 'ok', msg: 'success', grading_system });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view grading_system
router.post('/view_grading_system', async (req, res) => {
  const { token, grading_system_id } = req.body;

  // check for required fields
  if (!token || !grading_system_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch grading_system document
    const grading_system = await GradingSystem.findById({ doc_type: 'grading system' }).lean();

    // check if grading system exists
    if (!grading_system)
      return res.status(200).send({ status: 'ok', msg: 'no grading system set at the moment' });

    return res.status(200).send({ status: 'ok', msg: 'Success', grading_system });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to activate assessements
router.post('/activate_assessments', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // update continous assessment documents
    await ContinousAssessment.updateMany(
      { is_deleted: false },
      { is_completed: true }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success' });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

const {emailStaff} = require('../utils/nodemailer');

router.post("/email_staff_admin", async (req, res) => {
  const { token, email, message, staff_name} = req.body;

  // check for required fields
  if (!token || !email || !message || !staff_name){
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });
  }

  try {

      jwt.verify(token, process.env.JWT_SECRET);
      emailStaff(email, message, staff_name);
  
      return res.status(200).send({ status: "ok", msg: "Success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;