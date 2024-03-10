const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const GetInTouch = require("../models/get_in_touch");
const Statistics = require("../models/statistics");
const {replyGetInTouch} = require('../utils/nodemailer');

dotenv.config();
const router = express.Router();

// create get in touch
router.post("/get_in_touch", async (req, res) => {
  const { fullname, phone_no, email, message } = req.body;

  // check for required fields
  if (!fullname || !phone_no || !email || !message)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {

    const timestamp = Date.now();
    // create a new blog document and populate it
    let getInTouch = new GetInTouch();
    getInTouch.fullname = fullname;
    getInTouch.phone_no = phone_no;
    getInTouch.email = email;
    getInTouch.message = message;
    getInTouch.timestamp = timestamp;

    getInTouch = await getInTouch.save();

    //increase stats
    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_get_in_touches: 1}});

    return res.status(200).send({ status: "ok", msg: "Success", getInTouch });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});



// // endpoint to view blog
// router.post("/view_blog", async (req, res) => {
//   const { blog_id } = req.body;

//   // check for required fields
//   if (!blog_id)
//     return res
//       .status(400)
//       .send({ status: "error", msg: "all fields must be filled" });

//   try {
//     // fetch blog document
//     const blog = await Blog.findById({ _id: blog_id }).lean();

//     return res.status(200).send({ status: "ok", msg: "Success", blog });
//   } catch (e) {
//     console.log(e);
//     return res
//       .status(500)
//       .send({ status: "error", msg: "some error occurred", e });
//   }
// });

// endpoint to view get in touches
router.post("/view_get_in_touches", async (req, res) => {

    const {token, pagec} = req.body;

    if(!token || !pagec){
        return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
    }

    try{

    jwt.verify(token, process.env.JWT_SECRET);

    const resultsPerPage = 10;
    let page = pagec >= 1 ? pagec : 1;
    page = page -1;

    const get_in_touches = await GetInTouch.find().sort({timestamp: "desc"}).limit(resultsPerPage).skip(resultsPerPage * page).lean();

    if (get_in_touches.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no get in touches at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", get_in_touches, count: get_in_touches.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete get in touch request
router.post("/delete_get_in_touch", async (req, res) => {
  const { token, get_in_touch_id } = req.body;

  // check for required fields
  if (!token || !get_in_touch_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    
    await GetInTouch.deleteOne({ _id: get_in_touch_id }).lean();

    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_get_in_touches: -1}});

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to reply to get in touchk
router.post("/reply_get_in_touch", async (req, res) => {
    const { token, email, message, get_in_touch_id} = req.body;
  
    // check for required fields
    if (!token || !email || !message){
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
    }
      
  
    try {

        jwt.verify(token, process.env.JWT_SECRET);
        replyGetInTouch(email, message);
    
        await GetInTouch.updateOne({_id: get_in_touch_id}, {replied: "yes"});
    
        return res.status(200).send({ status: "ok", msg: "Success" });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });

module.exports = router;