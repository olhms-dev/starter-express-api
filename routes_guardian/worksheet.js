const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Worksheet = require('../models/worksheet');

dotenv.config();
const router = express.Router();

// endpoint to view worksheet
router.post('/view_worksheet', async (req, res) => {
  const { token, worksheet_id } = req.body;

  // check for required fields
  if (!token || !worksheet_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch worksheet document
    const worksheet = await worksheet.findById({ _id: worksheet_id }).lean();

    return res.status(200).send({ status: 'ok', msg: 'success', worksheet });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view class worksheets
router.post('/view_current_session_worksheets', async (req, res) => {
  const { token, session, class_name } = req.body;

  // check for required fields
  if (!token || !session || !class_name)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch worksheet document
    const worksheets = await Worksheet.find({ is_deleted: false, session, class_name }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if worksheets exist
    if (worksheets.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no worksheets at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', worksheets, count: worksheets.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view class worksheet based on week
router.post('/view_class_week_worksheet', async (req, res) => {
  const { token, week, subject_name, class_name } = req.body;

  // check for required fields
  if (!token || !week || !subject_name || !class_name)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch worksheet document
    const worksheet = await Worksheet.find({ is_deleted: false, week, subject_name, class_name }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if worksheets exist
    if (worksheet.length == 0)
      return res.status(200).send({ status: 'ok', msg: `no worksheet for this week ${week}`, count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', worksheet });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view worksheet based on category
router.post('/view_current_session_category_worksheets', async (req, res) => {
  const { token, category } = req.body;

  // check for required fields
  if (!token || !category)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch worksheet document
    const worksheets = await Worksheet.find({ is_deleted: false, category }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

    // check if worksheets exist
    if (worksheets.length === 0)
      return res.status(200).send({ status: 'ok', msg: `no worksheets with category ${category} at the moment`, count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', worksheets, count: worksheets.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;
