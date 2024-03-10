const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const ContinousAssessment = require("../models/continous_assessment");
const AnswerSheet = require("../models/answer_sheet");
const Result = require("../models/result");
const Settings = require("../models/settings");

dotenv.config();
const router = express.Router();

// endpoint to view exam
router.post("/view_exam", async (req, res) => {
  const { token, exam_id } = req.body;

  // check for required fields
  if (!token || !exam_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch exam document
    const exam = await ContinousAssessment.findById({ _id: exam_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success", exam });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view current session exams
router.post("/view_current_session_exams", async (req, res) => {
  const { token, session, class_name } = req.body;

  // check for required fields
  if (!token || !session || !class_name)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch exam document
    const exams = await ContinousAssessment.find(
      {
        is_deleted: false,
        is_completed: true,
        class_name,
        session,
        type: "exam",
      },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if exams exist
    if (exams.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no exams at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", exams, count: exams.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view current term exam
router.post("/view_current_term_exam", async (req, res) => {
  const { token, session, term, class_name, student_id } = req.body;

  // check for required fields
  if (!token || !session || !class_name || !term || !student_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch exam document
    const exam = await ContinousAssessment.find(
      {
        is_deleted: false,
        is_completed: true,
        class_name,
        session,
        term,
        type: "exam",
      },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if exams exist
    if (exam.length == 0)
      return res.status(200).send({
        status: "ok",
        msg: "no exam for this term at the moment",
        count: 0,
      });

    //check if exam is active
    const settings = await Settings.findOne({ doc_type: "settings" }).lean();
    if (settings.examination_active != true) {
      return res
        .status(200)
        .send({ status: "ok", msg: "assessment_not_active", exam: [] });
    }

    // check if student has written the exams
    exam.forEach((test) => {
      if (
        test.submissions_obj.length === 0 &&
        test.submissions_theory.length === 0
      ) {
        test.is_written_obj = false;
        test.is_written_theory = false;
      } else {
        test.is_written_obj = test.submissions_obj.some(
          (submission) => submission.student_id === student_id
        );
        test.is_written_theory = test.submissions_theory.some(
          (submission) => submission.student_id === student_id
        );
      }
      console.log(test.is_written_obj, test.is_written_theory);
    });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", exam, count: exam.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to submit exam
router.post("/submit_exam", async (req, res) => {
  const {
    token,
    subject,
    student_id,
    fullname,
    student_name,
    ca,
    exam_id,
    ca_date,
    ca_time,
    session,
    answers,
    class_name,
    term,
    section,
  } = req.body;

  // check for required fields
  if (
    !token ||
    !student_id ||
    !fullname ||
    !student_name ||
    !subject ||
    !exam_id ||
    !ca ||
    !session ||
    !term ||
    !answers ||
    !class_name ||
    !section
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const timestamp = Date.now();

    console.log(`fullname---> ${fullname}`);
    console.log(`student_name---> ${student_name}`);
    console.log(`subject---> ${subject}`);
    console.log(`answers---> ${answers}`);
    console.log(`class_name---> ${class_name}`);

    // create a new answer sheet document and populate it
    let answer_sheet = new AnswerSheet();
    answer_sheet.student_id = student_id;
    answer_sheet.fullname = fullname;
    answer_sheet.subject = subject;
    answer_sheet.session = session;
    answer_sheet.term = term;
    answer_sheet.answers = answers;
    answer_sheet.type = "exam";
    answer_sheet.class_name = class_name;
    answer_sheet.ca_date = ca_date;
    answer_sheet.ca_time = ca_time;
    answer_sheet.timestamp = timestamp;
    answer_sheet.section = section;

    await answer_sheet.save();

    console.log("Stage One");

    // // udpate the exam document
    // await ContinousAssessment.updateOne({_id: exam_id}, {$push: {submissions: {student_id, student_name, answer_sheet_id: answer_sheet._id}}}).lean();

    // udpate the exam document conditionally
    if (section === "a") {
      // update objective
      await ContinousAssessment.updateOne(
        { _id: exam_id },
        {
          $push: {
            submissions_obj: {
              student_id,
              student_name,
              answer_sheet_id: answer_sheet._id,
            },
          },
        }
      ).lean();
      console.log("Stage two");
    } else {
      // update theory
      await ContinousAssessment.updateOne(
        { _id: exam_id },
        {
          $push: {
            submissions_theory: {
              student_id,
              student_name,
              answer_sheet_id: answer_sheet._id,
            },
          },
        }
      ).lean();
      console.log("Stage three");
    }

    // fetch result document or create one if it doesn't exist for population
    let result = await Result.findOne({ student_id, session });
    if (!result) {
      result = new Result();
      result.student_id = student_id;
      result.student_name = fullname;
      result.teachers_id = "";
      result.class_name = class_name;
      result.session = session;
      result.validation_date = "";
      result.teachers_remark = "";
      result.term = term;
      result.timestamp = timestamp;

      let total_exam_score = 0;
      let grade = "Nil";
      let remark = "Nil";

      // calculate the total score of the exam
      answers.forEach((answer) => {
        if (answer.correct_answer === answer.student_answer) {
          total_exam_score += answer.mark;
        }
      });

      // update the results document if section submitted was a
      if (section === "a") {
        // if (total_exam_score === 100) {
        //   grade = "A";
        //   remark = "Distinction";
        // } else if (total_exam_score >= 70) {
        //   grade = "A";
        //   remark = "Excellent";
        // } else if (total_exam_score >= 60 && total_exam_score <= 69) {
        //   grade = "B";
        //   remark = "Very Good";
        // } else if (total_exam_score >= 50 && total_exam_score <= 59) {
        //   grade = "C";
        //   remark = "Good";
        // } else if (total_exam_score >= 40 && total_exam_score <= 49) {
        //   grade = "D";
        //   remark = "Fair";
        // } else if (total_exam_score <= 39) {
        //   grade = "F";
        //   remark = "Fail";
        // }

        result.results = [
          {
            subject,
            exam_obj: total_exam_score.toString(),
            total: total_exam_score.toString(),
            grade:"",
            remark:"Nil",
          },
        ];

        result.total_score = 0;
        result.average = 0;
        result.position = 0;

        // result.results = [
        //   {
        //     subject,
        //     exam_obj: total_exam_score.toString(),
        //     total: total_exam_score.toString(),
        //     grade,
        //     remark,
        //   },
        // ];

        // result.total_score = total_exam_score;
        // result.average =
        //   (total_exam_score / 1200) * 100 === Infinity
        //     ? 0
        //     : (total_exam_score / 1200) * 100;
        // result.position = 0;
        console.log("Stage four");
      }

      await result.save();
      console.log("Stage five");

      return res
        .status(200)
        .send({ status: "ok", msg: "success", answer_sheet });
    } else {
      let total_exam_score = 0;

      // calculate total score of the exam
      answers.forEach((answer) => {
        if (answer.correct_answer === answer.student_answer) {
          total_exam_score += answer.mark;
        }
      });

      // update result document if section submitted was section a
      if (section === "a") {
        let remark = "Nil";
        let grade = "";

        let subjectIndex = result.results.findIndex(
          (subjectObj) => subjectObj.subject === subject
        );
        let total_subject_score;

        // if the subject's object exists
        if (
          result.results[subjectIndex] &&
          result.results[subjectIndex].total !== undefined
        ) {

          let temp_test1_obj = result.results[subjectIndex]["first_ca_obj"] ?? 0;
          let temp_test1_theory = result.results[subjectIndex]["first_ca_theory"] ?? 0;
          let temp_test2_obj = result.results[subjectIndex]["second_ca_obj"] ?? 0;
          let temp_test2_theory = result.results[subjectIndex]["second_ca_theory"] ?? 0;
          let temp_exam_theory = result.results[subjectIndex]["exam_theory"] ?? 0;

          total_subject_score = temp_test1_obj + temp_test1_theory + temp_test2_obj + temp_test2_theory + temp_exam_theory +
            total_exam_score;
            console.log("Stage six");

        } else {
          total_subject_score = total_exam_score;
          console.log("Stage seven");
        }

        // console.log(`--------look here--1---> ${result.total_score}`)
        // console.log(`--------look here---2--> ${total_subject_score}`)
        // console.log(`--------look here----3-> ${typeof total_subject_score}`)

        // if (total_subject_score === 100) {
        //   grade = "A";
        //   remark = "Distinction";
        // } else if (total_subject_score >= 70) {
        //   grade = "A";
        //   remark = "Excellent";
        // } else if (total_subject_score >= 60 && total_subject_score <= 69) {
        //   grade = "B";
        //   remark = "Very Good";
        // } else if (total_subject_score >= 50 && total_subject_score <= 59) {
        //   grade = "C";
        //   remark = "Good";
        // } else if (total_subject_score >= 40 && total_subject_score <= 49) {
        //   grade = "D";
        //   remark = "Fair";
        // } else if (total_subject_score <= 39) {
        //   grade = "F";
        //   remark = "Fail";
        // }

        if (subjectIndex !== -1) {
          // Subject found, update existing entry
          result.results[subjectIndex].exam_obj = total_exam_score.toString();
          result.results[subjectIndex].total = total_subject_score.toString();
          result.results[subjectIndex].grade = grade;
          result.results[subjectIndex].remark = remark;
          // result.stage = 2;
          result.total_score += total_subject_score;
          
          console.log("Stage eight");
        } else {
          // Subject not found, add new entry
          result.results.push({
            subject,
            exam_obj: total_exam_score.toString(),
            total: total_subject_score.toString(),
            grade,
            remark,
          });

          // result.stage = 2;
          result.total_score += total_subject_score;
          
          result.position = 0;
          console.log("Stage nine");
        }
      } else {
        // section B (which teachers will manually enter scores)

        let subjectIndex = result.results.findIndex(
          (subjectObj) => subjectObj.subject === subject
        );
        // create only when the subject doesn't exist before
        if (subjectIndex === -1) {
          result.results.push({
            subject,
          });
        }
        // result.stage = 2;
        console.log("Stage ten");
      }

      await result.save();
      console.log("Stage eleven");

      return res
        .status(200)
        .send({ status: "ok", msg: "success", answer_sheet });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
