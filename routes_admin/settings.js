const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Settings = require('../models/settings');

dotenv.config();
const router = express.Router();


// endpoint to activate ca and exam
// ca_type : 1st C.A.T, 2nd C.A.T, Exam
router.post('/activate_ca_exam', async (req, res) => {
  const { token, ca_type, admin_name, admin_img, admin_id } = req.body;

  // check for required fields
  if (!token || !ca_type || !admin_name || !admin_img || !admin_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const timestamp = Date.now();

    const update = {
        time_changed: timestamp,
        admin_name,
        admin_img,
        admin_id,
        timestamp
    };

    if(ca_type == 'None'){
        update['first_ca_active'] = false;
        update['second_ca_active'] = false;
        update['examination_active'] = false;
    }

    if(ca_type == '1st C.A.T'){
        update['first_ca_active'] = true;
        update['second_ca_active'] = false;
        update['examination_active'] = false;
    }

    if(ca_type == '2nd C.A.T'){
        update['first_ca_active'] = false;
        update['second_ca_active'] = true;
        update['examination_active'] = false;
    }

    if(ca_type == 'Exam'){
        update['first_ca_active'] = false;
        update['second_ca_active'] = false;
        update['examination_active'] = true;
    }

    const settings = await Settings.findOneAndUpdate({doc_type: 'settings'},
        update,
        {new: true, upsert: true}
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'success', settings });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to set grading system
router.post('/set_grading_system', async (req, res) => {
    const { token, grading_system, admin_name, admin_img, admin_id  } = req.body;
  
    // check for required fields
    if (!token || !grading_system || !admin_name || !admin_img || !admin_id)
      return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });
  
    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      const timestamp = Date.now();
  
      const update = {
          time_changed: timestamp,
          admin_name,
          admin_img,
          admin_id,
          timestamp,
          grading_system
      };
  
      const settings = await Settings.findOneAndUpdate({doc_type: 'settings'},
          update,
          {new: true, upsert: true}
      ).lean();
  
      return res.status(200).send({ status: 'ok', msg: 'success', settings });
  
    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
  });

// endpoint to view settings
router.post('/view_settings', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch settings document
    const settings = await Settings.findOne({doc_type: 'settings'}).lean();

    return res.status(200).send({ status: 'ok', msg: 'success', settings });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;