const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const AdditionalResources = require('../models/additional_resources');

dotenv.config();
const router = express.Router();


// endpoint to view single additional_resources
router.post('/view_single_additional_resources', async (req, res) => {
  const { token, additional_resources_id } = req.body;

  // check for required fields
  if (!token || !additional_resources_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch additional_resources document
    const additional_resources = await AdditionalResources.findById({ _id: additional_resources_id }).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', additional_resources });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view multiple additional_resourcess
router.post('/view_multiple_additional_resources', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch additional_resources document
    const additional_resourcess = await AdditionalResources.find({ is_deleted: false }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if additional_resourcess exist
    if (additional_resourcess.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no additional_resourcess at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', additional_resourcess, count: additional_resourcess.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view multiple additional_resourcess based on week
router.post('/view_multiple_additional_resources_based_on_week', async (req, res) => {
  const { token, subject_name, week, class_name } = req.body;

  // check for required fields
  if (!token || !subject_name || !week || !class_name)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch additional_resources document
    const additional_resourcess = await AdditionalResources.find({ is_deleted: false, subject_name, class_name, week }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if additional_resourcess exist
    if (additional_resourcess.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no additional_resourcess at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', additional_resourcess, count: additional_resourcess.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;