const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const ContinousAssessment = require("../models/continous_assessment");
const Settings = require("../models/settings");
const Result = require("../models/result");
const Staff = require('../models/staff');

dotenv.config();
const router = express.Router();

// endpoint to create continous assessment
router.post(
  "/create_continous_assessment",
  upload.single("continous_assessment-images"),
  async (req, res) => {
    const {
      token,
      no_of_sections,
      ca_id,
      subject,
      ca,
      ca_date,
      ca_time,
      duration_a,
      duration_b,
      session,
      questions,
      type,
      class_name,
      term,
      section,
      previous_section,
    } = req.body;
    //send in ca_id field if the ca already has section a or b

    // check for required fields
    if (
      !token ||
      !subject ||
      !ca ||
      !session ||
      !no_of_sections ||
      !term ||
      !questions ||
      !type ||
      !class_name ||
      !section
    )
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
      // // upload profile picture
      // let img_url = '';
      // let img_id = '';
      // if(req.file) {
      //     const result = await cloudinary.uploader.upload(req.file.path, {folder: 'continous_assessment-profile-pictures'});
      //     console.log(result);
      //     img_url = result.secure_url;
      //     img_id = result.public_id;
      // }

      if (ca_id) {
        // fetch and update ca document

        let continous_assessment = [];
        if (previous_section == "a") {
          for (let i = 0; i < questions.length; i++) {
            continous_assessment = await ContinousAssessment.findByIdAndUpdate(
              { _id: ca_id },
              {
                no_of_sections: 2,
                $push: { questions_theory: questions[i] },
                section_present: section,
                duration_b,
              },
              { new: true }
            ).lean();
          }
        }

        if (previous_section == "b") {
          for (let i = 0; i < questions.length; i++) {
            continous_assessment = await ContinousAssessment.findByIdAndUpdate(
              { _id: ca_id },
              {
                no_of_sections: 2,
                $push: { questions_obj: questions[i] },
                section_present: section,
                duration_a,
              },
              { new: true }
            ).lean();
          }
        }

        return res
          .status(200)
          .send({ status: "ok", msg: "success", continous_assessment });
      }

      // create a new continous_assessment document and populate it
      let continous_assessment = new ContinousAssessment();
      continous_assessment.subject = subject;
      continous_assessment.ca = ca;
      continous_assessment.session = session;
      continous_assessment.no_of_sections = no_of_sections;
      continous_assessment.term = term || "";

      if (section == "a") {
        continous_assessment.questions_obj = questions;
        continous_assessment.duration_a = duration_a;
      }

      if (section == "b") {
        continous_assessment.questions_theory = questions;
        continous_assessment.duration_b = duration_b;
      }

      continous_assessment.type = type;
      continous_assessment.class_name = class_name;
      continous_assessment.ca_date = ca_date;
      continous_assessment.ca_time = ca_time;
      continous_assessment.submissions = [];
      continous_assessment.timestamp = Date.now();
      continous_assessment.section_present = section;

      await continous_assessment.save();

      return res
        .status(200)
        .send({ status: "ok", msg: "success", continous_assessment });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// // endpoint to upload section B of a ca or exam
// router.post('/upload_section_b', upload.single('continous_assessment-videos'), async (req, res) => {
//     const {token, ca_id, subject, ca, ca_date, ca_time, duration, session, questions, type, class_name, term} = req.body;
//     //send in ca_id field if the ca already has section a

//     // check for required fields
//     if(!token || !subject || !ca || !session || !term || !questions || !type || !class_name)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         jwt.verify(token, process.env.JWT_SECRET);
//         // // upload profile picture
//         // let img_url = '';
//         // let img_id = '';
//         // if(req.file) {
//         //     const result = await cloudinary.uploader.upload(req.file.path, {folder: 'continous_assessment-profile-pictures'});
//         //     console.log(result);
//         //     img_url = result.secure_url;
//         //     img_id = result.public_id;
//         // }

//         if(ca_id) {
//             // fetch and update ca document
//             let continous_assessment = [];
//             for(let i = 0; i < questions.length; i++ ) {
//                 continous_assessment = await ContinousAssessment.findByIdAndUpdate(
//                     {_id: ca_id},
//                     {$push: {questions: questions[i]}},
//                     {new: true}
//                 ).lean();
//             }

//             return res.status(200).send({status: 'ok', msg: 'success', continous_assessment});

//         }

//         // create a new continous_assessment document and populate it
//         let continous_assessment = new ContinousAssessment;
//         continous_assessment.subject = subject;
//         continous_assessment.ca = ca;
//         continous_assessment.session = session;
//         continous_assessment.term = term || '';
//         continous_assessment.questions = questions;
//         continous_assessment.type = type;
//         continous_assessment.class_name = class_name;
//         continous_assessment.ca_date = ca_date;
//         continous_assessment.ca_time = ca_time;
//         continous_assessment.duration = duration || '';
//         continous_assessment.submissions = [];
//         continous_assessment.timestamp = Date.now();

//         await continous_assessment.save();

//         return res.status(200).send({status: 'ok', msg: 'success', continous_assessment});

//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// endpoint to edit continous_assessment
// This endpoint can't work anymore because of the changes made to the endpoint above
router.post(
  "/edit_continous_assessment",
  upload.single("profile-pic"),
  async (req, res) => {
    const {
      token,
      subject,
      duration,
      is_completed,
      ca_date,
      type,
      class_name,
      ca,
      ca_time,
      session,
      questios,
      term,
      continous_assessment_id,
    } = req.body;

    // check for required fields
    if (!token || !continous_assessment_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      const Admin = jwt.verify(token, process.env.JWT_SECRET);
      // // upload profile picture
      // let img_url = '';
      // let img_id = '';
      // if(req.file) {
      //     const result = await cloudinary.uploader.upload(req.file.path, {folder: 'continous_assessment-profile-pictures'});
      //     console.log(result);
      //     img_url = result.secure_url;
      //     img_id = result.public_id;
      // }

      // fetch and update document
      let continous_assessment = await ContinousAssessment.findById({
        _id: continous_assessment_id,
      }).lean();

      continous_assessment = await ContinousAssessment.findByIdAndUpdate(
        { _id: continous_assessment_id },
        {
          subject: subject || continous_assessment.subject,
          ca_date: ca_date || continous_assessment.ca_date,
          ca_time: ca_time || continous_assessment.ca_time,
          session: session || continous_assessment.session,
          term: term || continous_assessment.term,
          duration: duration || continous_assessment.duration,
          ca: ca || continous_assessment.ca,
          questios: questios || continous_assessment.questios,
          class_name: class_name || continous_assessment.class_name,
          type: type || continous_assessment.type,
          is_completed: is_completed || continous_assessment.is_completed,
        },
        { new: true }
      ).lean();

      return res
        .status(200)
        .send({ status: "ok", msg: "Success", continous_assessment });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to view continous_assessment
router.post("/view_continous_assessment", async (req, res) => {
  const { token, continous_assessment_id } = req.body;

  // check for required fields
  if (!token || !continous_assessment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch continous_assessment document
    const continous_assessment = await continous_assessment
      .findById({ _id: continous_assessment_id })
      .lean();

    return res
      .status(200)
      .send({ status: "ok", msg: "Success", continous_assessment });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view specific continous_assessments based on session and term
router.post("/view_continous_assessments", async (req, res) => {
  const { token, session, term, subject, ca, type } = req.body;

  // check for required fields
  if (!token || !session || !term || !subject || !ca || !type)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    let teacher = jwt.verify(token, process.env.JWT_SECRET);

    // fetch teacher document
    let staff = await Staff.findById({_id: teacher._id}).lean();
    // const teacher_class = staff.class_name;
 
    // fetch continous_assessment document
    const continous_assessment = await ContinousAssessment.findOne(
      { is_deleted: false, session, term, subject, ca, type, class_name: staff.class_name},
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if continous_assessments exist
    if (!continous_assessment)
      return res.status(200).send({
        status: "ok",
        msg: "no continous_assessments at the moment",
        continous_assessment: {},
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", continous_assessment });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// // endpoint to view current term continous_assessments
// router.post('/view_current_term_continous_assessments', async (req, res) => {
//     const {token, session, term} = req.body;

//     // check for required fields
//     if(!token || !session || !term)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         jwt.verify(token, process.env.JWT_SECRET);

//         // fetch continous_assessment document
//         const continous_assessments = await ContinousAssessment.find({is_deleted: false, session, term}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

//         // check if continous_assessments exist
//         if(continous_assessments.length === 0)
//           return res.status(200).send({status: 'ok', msg: 'no continous_assessments at the moment', count: 0});

//         return res.status(200).send({status: 'ok', msg: 'success', continous_assessments, count: continous_assessments.length});

//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// endpoint to delete continous_assessment
router.post("/delete_continous_assessment", async (req, res) => {
  const { token, continous_assessment_id } = req.body;

  // check for required fields
  if (!token || !continous_assessment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch continous_assessment document
    await ContinousAssessment.updateOne(
      { _id: continous_assessment_id },
      { is_deleted: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to upload files
router.post(
  "/upload_files",
  upload.array("assessment_images"),
  async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token || req.files === undefined || req.files === null)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      const admin = jwt.verify(token, process.env.JWT_SECRET);

      // upload files
      const urls = [];
      const ids = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path, {
          folder: "assessment-images",
        });
        urls.push(result.secure_url);
        ids.push(result.public_id);
      }

      return res
        .status(200)
        .send({ status: "ok", msg: "success", ca_imgs: { urls, ids } });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to upload videos
router.post(
  "/upload_videos",
  upload.array("assessment_videos"),
  async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token || req.files === undefined || req.files === null)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      const admin = jwt.verify(token, process.env.JWT_SECRET);

      // upload files
      const urls = [];
      const ids = [];
      for (let i = 0; i < req.files.length; i++) {
        const result = await cloudinary.uploader.upload(req.files[i].path, {
          folder: "assessment-videos",
          resource_type: "video",
          chunk_size: 6000000,
        });
        urls.push(result.secure_url);
        ids.push(result.public_id);
      }

      return res
        .status(200)
        .send({ status: "ok", msg: "success", ca_videos: { urls, ids } });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// delete files
router.post("/delete_files", async (req, res) => {
  const { token, ids } = req.body;

  // check for required fields
  if (!token || !ids)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // delete files
    for (let i = 0; i < ids.length; i++) {
      await cloudinary.uploader.destroy(ids[i]);
    }

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// submit theory ca and exam endpoint
// endpoint to submit assessment
router.post("/submit_assessment", async (req, res) => {
  const {
    token,
    continous_assessment_id,
    session,
    term,
    student_id,
    student_name,
    ca,
    section,
    subject,
    answers,
    score,
  } = req.body;

  // check for required fields
  if (
    !token ||
    !continous_assessment_id ||
    !session ||
    !term ||
    !student_id ||
    !student_name ||
    !ca ||
    !section ||
    !subject
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const settings = await Settings.findOne({ doc_type: "settings" }).lean();
    const level_one = settings.grading_system.level_one;
    const level_two = settings.grading_system.level_two;
    const level_three = settings.grading_system.level_three;
    const level_four = settings.grading_system.level_four;
    const level_five = settings.grading_system.level_five;

    const submission = {};
    const mResult = {
      first_ca: 0,
      second_ca: 0,
      exam: undefined,
      total: undefined,
      grade: undefined,
      remark: undefined,
    };

    submission.student_name = student_name;
    submission.student_id = student_id;
    submission.section = section;
    submission.score = score || "";
    submission.answers = answers;
    submission.answer_sheet_id = "";

    if (ca == 1) {
      mResult.subject = subject;
      mResult.first_ca = score;
    }

    if (ca == 2) {
      mResult.subject = subject;
      mResult.second_ca = score;
    }

    if (ca == 3) {
      // calculate total, grade and remark

      const pResult = await Result.findOne({
        student_id,
        session,
        term,
      }).lean();
      let total;
      let remark;
      let grade;

      pResult.results.map((result) => {
        if (result.subject == subject) {
          total = parseInt(result.first_ca) + parseInt(result.second_ca);
        }
      });

      // estimate the remark and grade

      if (level_one.score_range.includes(">=")) {
        let lvVal = parseInt(level_one.split("=")[1].trim());
        if (total >= lvVal) {
          remark = level_one.remark;
          grade = level_one.grade;
        }
      }

      if (level_five.score_range.includes("<=")) {
        let lvVal = parseInt(level_five.split("=")[1].trim());
        if (total <= lvVal) {
          remark = level_five.remark;
          grade = level_five.grade;
        }
      }

      if (level_two.score_range.includes("-")) {
        let lvVala = parseInt(level_two.split("-")[0].trim());
        let lvValb = parseInt(level_two.split("-")[1].trim());

        if (total >= lvVala && total <= lvValb) {
          remark = level_two.remark;
          grade = level_two.grade;
        }
      }

      if (level_three.score_range.includes("-")) {
        let lvVala = parseInt(level_three.split("-")[0].trim());
        let lvValb = parseInt(level_three.split("-")[1].trim());

        if (total >= lvVala && total <= lvValb) {
          remark = level_three.remark;
          grade = level_three.grade;
        }
      }

      if (level_four.score_range.includes("-")) {
        let lvVala = parseInt(level_four.split("-")[0].trim());
        let lvValb = parseInt(level_four.split("-")[1].trim());

        if (total >= lvVala && total <= lvValb) {
          remark = level_four.remark;
          grade = level_four.grade;
        }
      }

      mResult.subject = subject;
      mResult.exam = score;
      mResult.total = total.toString();
      mResult.grade = grade;
      mResult.remark = remark;
    }

    let assessment;

    if (section == "a") {
      assessment = await ContinousAssessment.findOneAndUpdate(
        { continous_assessment_id },
        { $push: { submissions_obj: submission } },
        { new: true }
      ).lean();
    }

    if (section == "b" && (score == "" || score == undefined)) {
      assessment = await ContinousAssessment.findOneAndUpdate(
        { continous_assessment_id },
        { $push: { submissions_theory: submission } },
        { new: true }
      ).lean();
    }

    if (section == "b" && score != "" && score != undefined) {
      assessment = await ContinousAssessment.findOneAndUpdate(
        {
          continous_assessment_id,
          "submissions_theory.student_id": student_id,
        },
        {
          $set: {
            "submissions_theory.$.score": score,
          },
        },
        { new: true }
      ).lean();
    }

    const found = await Result.findOne({ student_id, session, term }).lean();
    let foundResult;

    found.results.map((result) => {
      if (result.subject == subject) {
        foundResult = result;
      }
    });

    let result;
    if (foundResult) {
      result = await Result.findOneAndUpdate(
        { student_id, session, term, "results.subject": subject },
        {
          "results.$.subject": subject,
          "results.$.exam": mResult.exam || foundResult.exam,
          "results.$.total": mResult.total || foundResult.total,
          "results.$.grade": mResult.grade || foundResult.grade,
          "results.$.remark": mResult.remark || foundResult.remark,
          $inc: {
            "results.$.first_ca": mResult.first_ca,
            "results.$.second_ca": mResult.second_ca,
          },
        },
        { new: true }
      ).lean();
    } else {
      result = await Result.findOneAndUpdate(
        { student_id, session, term },
        { $push: { results: mResult } },
        { new: true }
      ).lean();
    }

    return res
      .status(200)
      .send({ status: "ok", msg: "Success", assessment, result });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

//endpoint to mark assessment as completed
router.post("/continous_assessment_completed", async (req, res) => {
  const { token, is_completed, continous_assessment_id } = req.body;

  // check for required fields
  if (!token || !continous_assessment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // // fetch and update document
    // let continous_assessment = await ContinousAssessment.findById({_id: continous_assessment_id}).lean();

    await ContinousAssessment.findByIdAndUpdate(
      { _id: continous_assessment_id },
      {
        is_completed,
      }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success" });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      status: "error",
      msg: "some error occurred",
      error: e.toString(),
    });
  }
});

module.exports = router;
