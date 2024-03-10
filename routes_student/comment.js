const express = require('express');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');

// change to returning a list of 10 most recent comments
// instead of just the most recent comment
const router = express.Router();

// endpoint to make a comment on a blog
router.post('/comment', async (req, res) => {
  const {token, comment, blog_id, owner_name, owner_email } = req.body;

  console.log(req.body);

  if (!blog_id || !comment || !owner_name || !owner_email) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  const timestamp = Date.now();

  try {

    let user;
    if(token){
      user = jwt.verify(token, process.env.JWT_SECRET);
    }

    let mComment = await new Comment;

    mComment.comment = comment;
    mComment.post_id = blog_id;
    mComment.owner_id = "";
    mComment.owner_name = owner_name;
    mComment.owner_email = owner_email;
    mComment.owner_img = '';
    mComment.timestamp = timestamp;

    await mComment.save();

    const blog = await Blog.findOneAndUpdate(
      { _id: blog_id },
      { "$inc": { comment_count: 1 } },
      { new: true, fields: {comment_count: 1} }
    );
    return res.status(200).send({ status: 'ok', msg: 'success', blog, comment: mComment });

  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

// endpoint to get comments of a blog
router.post('/get_comments', async (req, res) => {
  const { token, blog_id, pagec } = req.body;

  if (!blog_id || !pagec) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {

    let user;
    if(token){
      user = jwt.verify(token, process.env.JWT_SECRET);
    }

    const resultsPerPage = 3;
    let page = pagec >= 1 ? pagec : 1;
    page = page - 1;

    const comments = await Comment.find({ post_id: blog_id })
      .sort({ timestamp: 'desc' })
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

    return res.status(200).send({ status: 'ok', msg: 'success', comments });
  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

// endpoint to delete a comment
router.post('/delete_comment', async (req, res) => {
  const { token, _id, blog_id } = req.body;

  // check for required fields
  if (!token || !_id || !blog_id)
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

  try {
    // token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // delete comment
    const comment = await Comment.findOneAndDelete({ _id });
    if (!comment)
      return res.status(400).send({ status: 'error', msg: 'Comment not found' });

    // update blog document
    const blog = await Blog.findOneAndUpdate(
      { _id: blog_id },
      { '$inc': { comment_count: -1 } },
      { new: true }
    ).lean();

    return res.status(200).send({ status: 'ok', msg: 'Comment deleted successfully', blog });
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
    const user = jwt.verify(token, process.env.JWT_SECRET);

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
    return res.status(200).send({ status: 'ok', msg: 'success', comment });

  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: 'Some error occurred', e });
  }
});

// endpoint to get replies of a comment
router.post('/get_replies_of_comment', async (req, res) => {
  const { token, comment_id, pagec } = req.body;

  if (!token || !comment_id || !pagec) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const resultsPerPage = 2;
    let page = pagec >= 1 ? pagec : 1;
    page = page - 1;

    const comments = await Comment.find({ comment_id })
      .sort({ timestamp: 'desc' })
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

    return res.status(200).send({ status: 'ok', msg: 'success', comments });
  } catch (e) {
    console.log(e);
    return res.status({ status: 'error', msg: 'An error occured' });
  }
});

module.exports = router; 