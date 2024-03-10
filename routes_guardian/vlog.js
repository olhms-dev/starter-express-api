const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Vlog = require('../models/vlog');

dotenv.config();
const router = express.Router();

// endpoint to view vlog
router.post('/view_vlog', async (req, res) => {
  const { token, vlog_id } = req.body;

  // check for required fields
  if (!token || !vlog_id)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch vlog document
    const vlog = await Vlog.findByIdAndUpdate({ _id: vlog_id }, { $inc: { view_count: 1 } }, { new: true }).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', vlog });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view vlogs
router.post('/view_vlogs', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch vlog document
    const vlogs = await Vlog.find({ is_deleted: false }, { is_deleted: 0, video_id: 0 }).sort({timestamp: "desc"}).lean();

    // check if vlogs exist
    if (vlogs.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no vlogs at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', vlogs, count: vlogs.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view vlog categories
router.post('/view_vlog_categories', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch vlog document
    const vlogs = await Vlog.find({ is_deleted: false }, { category: 1 }).lean();

    // check if vlogs exist
    if (vlogs.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no vlog categories at the moment', count: 0 });

    const categories = [];
    vlogs.forEach(vlog => {
      categories.push(vlog.category);
    });

    return res.status(200).send({ status: 'ok', msg: 'success', categories, count: vlogs.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;