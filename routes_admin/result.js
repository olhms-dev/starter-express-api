const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Result = require("../models/result");
const Student = require("../models/student");

dotenv.config();
const router = express.Router();

// endpoint to promote student
router.post("/promote_student", async (req, res) => {
  const { token, admin_name, result_id, student_id, new_class_name } = req.body;

  // check for required fields
  if (!token || !result_id || !student_id || !admin_name || !new_class_name)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // update result document
    const result = await Result.findByIdAndUpdate(
      { _id: result_id },
      { is_promoted_by: admin_name }
    ).lean();

    // update student document
    await Student.findOneAndUpdate(
      { student_id },
      { class_name: new_class_name }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to repeat student
router.post("/repeat_student", async (req, res) => {
  const { token, admin_name, result_id, student_id, class_name } = req.body;

  // check for required fields
  if (!token || !result_id || !student_id || !admin_name || !class_name)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // update result document
    const result = await Result.findByIdAndUpdate(
      { _id: result_id },
      { is_repeated_by: admin_name }
    ).lean();

    // update student document
    await Student.findOneAndUpdate(
      { student_id },
      { $push: { repeated_classes: class_name } }
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
router.post("/validate_result", async (req, res) => {
  const {
    token,
    next_term_fee,
    other_fees,
    total_fees,
    affective_traits,
    psycho_motive_traits,
    result_id,
    student_name,
    teachers_name,
    results,
    term,
    validation_date,
    teachers_remark,
    session,
    student_id,
    class_name,
    no_of_subjects_passed,
    no_of_subjects_failed,
    total_score,
    average,
    is_validated,
    is_promoted_by,
    is_repeated_by,
    head_teachers_remark,
    is_validated_by,
    verdict,
    validator_id,
    overall_remark,
    attendance_score,
  } = req.body;

  // check for required fields
  if (!token || !result_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch and update document
    let result = await Result.findById({ _id: result_id }).lean();

    result = await Result.findByIdAndUpdate(
      { _id: result_id },
      {
        student_id: student_id || result.student_id,
        results: results || result.results,
        next_term_fee: next_term_fee || result.next_term_fee,
        other_fees: other_fees || result.other_fees,
        total_fees: total_fees || result.total_fees,
        student_name: student_name || result.student_name,
        teachers_name: teachers_name || result.teachers_name,
        term: term || result.term,
        validation_date: validation_date || result.validation_date,
        teachers_remark: teachers_remark || result.teachers_remark,
        session: session || result.session,
        class_name: class_name || result.class_name,
        no_of_subjects_passed: no_of_subjects_passed || result.no_of_subjects_passed,
        no_of_subjects_failed: no_of_subjects_failed || result.no_of_subjects_failed,
        total_score: total_score || result.total_score,
        average: average || result.average,
        is_validated: is_validated || result.is_validated,
        affective_traits: affective_traits || result.affective_traits,
        psycho_motive_traits:
          psycho_motive_traits || result.psycho_motive_traits,
        is_promoted_by: is_promoted_by,
        is_repeated_by: is_repeated_by,
        head_teachers_remark:
          head_teachers_remark || result.head_teachers_remark,
        is_validated_by: is_validated_by || result.is_validated_by,
        verdict: verdict || result.verdict,
        validator_id: validator_id || result.validator_id,
        overall_remark: overall_remark || result.overall_remark,
        attendance_score: attendance_score || result.attendance_score,

      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({
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
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view results
router.post("/view_results", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch result document
    const results = await Result.find(
      { is_deleted: false },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if results exist
    if (results.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no results at the moment", count: 0 });

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

// endpoint to update validated result url
router.post("/update_validated_result_url", async (req, res) => {
  const { token, result_id, validated_result_url, validated_result_url_id } = req.body;

  // check for required fields
  if (!token || !result_id || !validated_result_url_id || !validated_result_url)
    return res.status(400).send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const result = await Result.findByIdAndUpdate(
      { _id: result_id },
      {
        is_validated: true,
        validation_date: Date.now(),
        validated_result_url: validated_result_url,
        validated_result_url_id: validated_result_url_id,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", result });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", e });
  }
});

// upload file
router.post("/upload_validated_result", upload.single("pdf"), async (req, res) => {
  const { token } = req.body;

  // check for required fields
  // if (!token || req.file === undefined)
  //   return res.status(400).send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // upload result
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "validated-results" }
    );

    return res.status(200).send({ status: "ok", msg: "success", pdf_url: secure_url, pdf_id: public_id });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
