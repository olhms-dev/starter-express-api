const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const VideoLearning = require('../models/video_learning');

dotenv.config();
const router = express.Router();

// endpoint to view video_learning
router.post('/view_video_learning', async (req, res) => {
  const { video_learning_id, token } = req.body;

  // check for required fields
  if (!video_learning_id || !token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // token authentication
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch video_learning document and increment view count field
    const video_learning = await VideoLearning.findByIdAndUpdate({ _id: video_learning_id }, { $inc: { view_count: 1 } }, { new: true }).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', video_learning });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to view video_learnings
router.post('/view_video_learnings', async (req, res) => {
  const { token } = req.body; // page count

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // token authentication
    jwt.verify(token, process.env.JWT_SECRET);

    // const resultsPerPage = 15;
    // let page = pagec >= 1 ? pagec : 1;
    // page = page - 1;

    // fetch video_learning documents
    const video_learnings = await VideoLearning.find(
      { is_deleted: false },
      { is_deleted: 0, video_id: 0 }
    ).lean();

    // check if video_learnings exist
    if (video_learnings.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no video_learnings at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', video_learnings, count: video_learnings.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// view video learnings based on views
router.post('/view_video_learnings_based_on_view_count', async (req, res) => {
  const { token } = req.body; // page count

  // check for required fields
  if (!token)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // token authentication
    jwt.verify(token, process.env.JWT_SECRET);

    // const resultsPerPage = 15;
    // let page = pagec >= 1 ? pagec : 1;
    // page = page - 1;

    // fetch video_learning documents
    const video_learnings = await VideoLearning.find(
      { is_deleted: false },
      { is_deleted: 0, video_id: 0 }
    ).lean();

    // check if video_learnings exist
    if (video_learnings.length === 0)
      return res.status(200).send({ status: 'ok', msg: 'no video_learnings at the moment', count: 0 });

    return res.status(200).send({ status: 'ok', msg: 'success', video_learnings, count: video_learnings.length });


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;