const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Result = require("../models/result");

dotenv.config();
const router = express.Router();

// endpoint to validate result
router.post("/validate_result", upload.single("profile-pic"),async (req, res) => {
  const { token, head_teachers_name, result_id } = req.body;

  // check for required fields
  if (!token || !result_id || !teachers_name || req.file === undefined || req.file === null)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // upload result    
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {folder: 'validated-results'});

    let result = await Result.findByIdAndUpdate(
      { _id: result_id },
      {
        is_validated: true,
        is_validated_by: head_teachers_name,
        validation_date: Date.now(),
        validated_result_url: secure_url,
        validated_result_url_id: public_id,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit result
router.post("/edit_result", async (req, res) => {
  const {
    token,
    attendance_score,
    affective_traits,
    psycho_motive_traits,
    result_id,
    overall_remark,
    teachers_remark,
    
  } = req.body;

  // check for required fields
  if (!token || !result_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const teacher = jwt.verify(token, process.env.JWT_SECRET);

    // fetch and update document
    let result = await Result.findById({ _id: result_id }).lean();

    result = await Result.findByIdAndUpdate(
      { _id: result_id },
      {
        teachers_remark: teachers_remark || result.teachers_remark,
        overall_remark: overall_remark || result.overall_remark,
        attendance_score: attendance_score || result.attendance_score,
        affective_traits: affective_traits || result.affective_traits,
        psycho_motive_traits:
          psycho_motive_traits || result.psycho_motive_traits,
        
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

/**
 * Results is going to be a list of objects holding all the subjects
 * with their respective marks
 * results: [
        {
            subject: String,
            first_ca: Number,
            second_ca: Number,
        }
    ],
    

 */
//This endpoint is used only when a result does not exist
//endpoint to manually add result scores
router.post("/add_scores", async (req, res) => {
  const { token, student_id, student_name, results, term, session, class_name, teachers_name, center, stage} = req.body;

  console.log(req.body);
  // check for required fields
  if (!token || !student_id || !student_name || !term || !session || !class_name || !teachers_name || !center )
  // if (!token || !student_id || !student_name || !results || !term || !session || !class_name || !teachers_name || !center || !stage )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const teacher = jwt.verify(token, process.env.JWT_SECRET);
    const timestamp = Date.now();

    // fetch and update document
    const result = await Result.findOneAndUpdate(
        {
          student_id,
          session,
          class_name,
          term,
          center
        },
        { $set: { results: results }, timestamp, stage, teachers_id: teacher._id, teachers_name, student_name},
        { upsert: true, new: true }
      );

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    return res.status(500).send({
      status: "error",
      msg: "some error occurred",
      error: e.toString(),
    });
  }
});

// endpoint to view result
router.post("/view_result", async (req, res) => {
  const { token, result_id } = req.body;

  // check for required fields
  if (!token || !result_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch result document
    const result = await Result.findById({ _id: result_id }).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// view result based on term
router.post("/view_term_result", async (req, res) => {
  const { token, session, term } = req.body;

  // check for required fields
  if (!token || !session || !term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch result document
    const result = await Result.findOne({
      is_deleted: false,
      session,
      term,
    }).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    return res.status(500).send({
      status: "error",
      msg: "some error occurred",
      error: e.toString(),
    });
  }
});

// endpoint to view results
router.post("/view_results", async (req, res) => {
  const { token, session, term, class_name, center } = req.body;

  // check for required fields
  if (!token || !session || !term || !class_name || !center)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch result document
    const results = await Result.find(
      { is_deleted: false, session, term, class_name, center },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if results exist
    if (results.length === 0)
      return res.status(200).send({
        status: "ok",
        msg: "no results at the moment",
        count: 0,
        results: [],
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", results, count: results.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete result
router.post("/delete_result", async (req, res) => {
  const { token, result_id } = req.body;

  // check for required fields
  if (!token || !result_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch result document
    await Result.updateOne({ _id: result_id }, { is_deleted: true }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
