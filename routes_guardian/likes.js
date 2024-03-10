const express = require('express');
const Vlog = require('../models/vlog');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');

const router = express.Router();

// endpoint to like a vlog
router.post('/like_vlog', async (req, res) => {
  const { token, vlog_id } = req.body;

  // check for required fields
  if (!token || !vlog_id) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {
    // token verification
    let user = jwt.verify(token, process.env.JWT_SECRET);

    // check if vlog has been liked
    const found = await Vlog.findOne({ _id: vlog_id, likes: user._id });
    if (found)
      return res.status(400).send({ status: 'error', msg: 'You already liked this vlog' });

    // edit the vlog document
    const vlog = await Vlog.findByIdAndUpdate(
      { _id: vlog_id },
      {
        "$push": { likes: user._id },
        "$inc": { like_count: 1 }
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', vlog });

  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured', e });
  }
});

// endpoint to like a comment on a vlog
router.post('/comment_like', async (req, res) => {
  const { token, comment_id } = req.body;

  // check for required fields
  if (!token || !comment_id)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // check if comment has been liked
    let comment = await Comment.findOne({ _id: comment_id, likes: user._id }).lean();
    if (comment)
      return res.status(400).send({ status: 'error', msg: "You've already liked this comment" });

    // edit the comment document
    comment = await Comment.findByIdAndUpdate(
      { _id: comment_id },
      {
        '$push': { likes: user._id },
        '$inc': { like_count: 1 }
      },
      { new: true }
    );

    return res.status(200).send({ status: 'ok', msg: 'Comment liked successfully', comment });
  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: 'Some error occurred', e });
  }
})

// endpoint to unlike a vlog
router.post('/unlike_vlog', async (req, res) => {
  const { token, vlog_id } = req.body;

  // check for required fields
  if (!token || !vlog_id) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {
    // token verification
    let user = jwt.verify(token, process.env.JWT_SECRET);

    // check if comment has been unliked
    const found = await Vlog.findOne({ _id: vlog_id, likes: user._id });
    if (!found)
      return res.status(400).send({ status: 'error', msg: 'You haven\'t liked this vlog before' });

    // edit the vlog document
    const vlog = await Vlog.findByIdAndUpdate(
      { _id: vlog_id },
      {
        "$pull": { likes: user._id },
        "$inc": { like_count: -1 }
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Success', vlog });

  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured', e });
  }
});

// endpoint to unlike a comment on a vlog
router.post('/unlike_comment', async (req, res) => {
  const { comment_id, token } = req.body;

  // check for required fields
  if (!comment_id || !token)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // check if comment has been unliked before
    let comment = Comment.findOne({ _id: comment_id, likes: user._id }).lean();
    if (!comment)
      return res.status(400).send({ status: 'error', msg: 'You have not liked this comment before' });

    // edit comment document
    comment = await Comment.findOneAndUpdate(
      { _id: comment_id, likes: user._id },
      {
        '$pull': { likes: user._id },
        '$inc': { like_count: -1 }
      }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Comment liked successfully', comment });
  } catch (e) {
    console.log(e);
    return res(400).send({ status: 'error', msg: 'Some error occurred', e })
  }
});

module.exports = router;