const express = require('express');
const Vlog = require('../models/vlog');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');

// change to returning a list of 10 most recent comments
// instead of just the most recent comment
const router = express.Router();

// endpoint to make a comment on a vlog
router.post('/comment', async (req, res) => {
  const { token, comment, vlog_id, owner_name, owner_img } = req.body;

  if (!token || !vlog_id || !comment || !owner_name) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  const timestamp = Date.now();

  try {
    let user = jwt.verify(token, process.env.JWT_SECRET);

    let mComment = await new Comment;
    mComment.comment = comment;
    mComment.post_id = vlog_id;
    mComment.owner_id = user._id;
    mComment.owner_name = owner_name;
    mComment.owner_img = owner_img || '';
    mComment.timestamp = timestamp;

    await mComment.save();

    const vlog = await Vlog.findOneAndUpdate(
      { _id: vlog_id },
      { "$inc": { comment_count: 1 } },
      { new: true }
    );
    return res.status(200).send({ status: 'ok', msg: 'success', vlog, comment: mComment.comment, comment_doc: mComment });

  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

// endpoint to get comments of a vlog
router.post('/get_comments', async (req, res) => {
  const { token, vlog_id, pagec } = req.body;

  if (!token || !vlog_id || !pagec) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    // const resultsPerPage = 2;
    // let page = pagec >= 1 ? pagec : 1;
    // page = page - 1;

    const comments = await Comment.find({ post_id: vlog_id })
      .sort({ timestamp: 'desc' })
      .lean();

    return res.status(200).send({ status: 'ok', msg: 'success', comments });
  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

// endpoint to delete a comment
router.post('/delete_comment', async (req, res) => {
  const { token, _id, vlog_id } = req.body;

  // check for required fields
  if (!token || !_id || !vlog_id)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    // token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // delete comment
    const comment = await Comment.findOneAndDelete({ _id });
    if (!comment)
      return res.status(400).send({ status: 'error', msg: 'Comment not found' });

    // update vlog document
    const vlog = await Vlog.findOneAndUpdate(
      { _id: vlog_id },
      { '$inc': { comment_count: -1 } },
      { new: true }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Comment deleted successfully', vlog });
  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: 'Some error occurred' });
  }
});
// endpoint to edit a comment 
router.post('/edit_comment', async (req, res) => {
  const { token, _id, comment_body } = req.body;

  if (!token, _id)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    let comment = await Comment.findOneAndUpdate(
      { _id },
      {
        edited: true,
        comment: comment_body || comment.comment
      },
      { new: true }
    );
    if (!comment)
      return res.status(404).send({ status: 'ENOENT', msg: 'Comment not found' });

    return res.status(200).send({ status: 'ok', msg: 'Comment updated successfully', comment });
  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: 'Some error occurred' })
  }
});

//endpoint to reply a comment
router.post('/reply_comment', async (req, res) => {
  const { _id, token, comment_body, owner_img, owner_name } = req.body;
  // the _id field is the _id of the document that a comment is being made on

  if (!_id || !token)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    let comment = await Comment.findByIdAndUpdate(
      { _id },
      { '$inc': { reply_count: 1 } },
      { new: true }
    ).lean();

    comment = await new Comment;
    comment.comment = comment_body;
    comment.comment_id = _id;
    comment.owner_id = user._id;
    comment.owner_name = owner_name;
    comment.owner_img = owner_img || '';

    await comment.save();
    return res.status(200).send({ status: 'ok', msg: 'success', comment: comment.comment_body, comment_doc: comment});

  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: 'Some error occurred', e });
  }
});

// endpoint to get replies of a comment
router.post('/get_replies_of_comment', async (req, res) => {
  const { token, comment_id } = req.body;

  if (!token || !comment_id) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    // const resultsPerPage = 10;
    // let page = pagec >= 1 ? pagec : 1;
    // page = page - 1;

    const comments = await Comment.find({ comment_id })
      .sort({ timestamp: 'desc' })
      .lean();

    return res.status(200).send({ status: 'ok', msg: 'success', comments });
  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

module.exports = router; 