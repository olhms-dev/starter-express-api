const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Subject = require("../models/subject");
const Session = require('../models/session');

dotenv.config();
const router = express.Router();

// endpoint to create subject
router.post("/create_subject", async (req, res) => {
  const { token, subject_name, school, preview, class_name, lessons } =
    req.body;

  // check for required fields
  if (!token || !subject_name || !class_name || !school)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    let subject_found = await Subject.findOne({
      subject_name,
      class_name,
    }).lean();

    if (subject_found)
      return res
        .status(400)
        .send({ status: "error", msg: "subject already exist" });

    // create a new subject document and populate it
    let subject = new Subject();
    subject.subject_name = subject_name;
    subject.class_name = class_name;
    subject.school = school;
    subject.total_no_lessons = 0;
    subject.preview = preview || "";
    subject.lessons = lessons || [];
    subject.timestamp = Date.now();

    await subject.save();

    return res.status(200).send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view subjects
router.post("/view_subjects", async (req, res) => {
  const { token, class_name } = req.body;

  // check for required fields
  if (!token || !class_name)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subjects = await Subject.find(
      { is_deleted: false, class_name },
      { is_deleted: 0, timestamp: 0 }
    ).lean();

    // check if subjects exist
    if (subjects.length === 0)
      return res.status(200).send({
        status: "ok",
        msg: "no subjects at the moment at the moment",
        count: 0,
        subjects: [],
      });

    // fetch current_term
    const {current_term} = await Session.findOne({ is_deleted: false, current_session: true }, { current_term:1 }).lean();

    // remove lessons that are not for that  term
    subjects.forEach(subject => {
      for (let i = subject.lessons.length - 1; i >= 0; i--) {
        if (subject.lessons[i].term !== current_term) {
          subject.lessons.splice(i, 1);
        }
      }
    });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", count: subjects.length, subjects });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", error: e.toString() });
  }
});

// endpoint to view subject
router.post("/view_subject", async (req, res) => {
  const { token, subject_id } = req.body;

  // check for required fields
  if (!token || !subject_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findById({ _id: subject_id }).lean();

    if (!subject)
      return res.status(403).send({ status: "ok", msg: "subject not found" });

    return res.status(200).send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete subject
router.post("/delete_subject", async (req, res) => {
  const { token, subject_id } = req.body;

  // check for required fields
  if (!token || !subject_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findByIdAndUpdate(
      { _id: subject_id },
      { is_deleted: true },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit subject
router.post(
  "/edit_subject",
  upload.array("subject_materials"),
  async (req, res) => {
    const {
      token,
      subject_id,
      school,
      subject_name,
      preview,
      class_name,
      deleted_urls,
      deleted_ids,
    } = req.body;

    // check for required fields
    if (!token || !subject_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      const Admin = jwt.verify(token, process.env.JWT_SECRET);

      //upload files conditionally
      const urls = [];
      const ids = [];

      // delete files conditionally
      if (deleted_ids) {
        for (let i = 0; i < deleted_ids.length; i++) {
          await cloudinary.uploader.destroy(deleted_ids[i]);
        }
      }

      if (req.files) {
        if (req.files.length != 0) {
          for (let i = 0; i < req.files.length; i++) {
            let result = await cloudinary.uploader.upload(req.files[i].path, {
              folder: "subject materials",
              quality: "auto",
              fetch_format: "auto",
            });
            urls.push(result.secure_url);
            ids.push(result.public_id);
          }
        }
      }

      // fetch and update document
      let subject = await Subject.findById({ _id: subject_id }).lean();

      deleted_urls.forEach((deleted_url) => {
        subject.urls.forEach((element, index) => {
          if (element == deleted_url) {
            subject.urls.splice(index, 1);
          }
        });
      });
      deleted_ids.forEach((deleted_id) => {
        subject.ids.forEach((element, index) => {
          if (element == deleted_id) {
            subject.ids.splice(index, 1);
          }
        });
      });

      const urlsM = subject.urls.concat(urls);
      const idsM = subject.ids.concat(ids);
      subject = await Subject.findByIdAndUpdate(
        { _id: subject_id },
        {
          subject_name: subject_name || subject.subject_name,
          class_name: class_name || subject.class_name,
          school: school || subject.school,
          preview: preview || subject.preview,
          urls: urlsM || subject.urls,
          ids: idsM || subject.ids,
        },
        { new: true }
      ).lean();

      return res.status(200).send({ status: "ok", msg: "Success", subject });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to add a lesson
router.post("/add_lesson", async (req, res) => {
  const { token, subject_name, class_name, week_no, term } = req.body;

  // check for required fields
  if (!token || !subject_name || !class_name || !week_no || !term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // // fetch subject document
    // const subject = await Subject.findOneAndUpdate(
    //   {class_name, subject_name}, {$push: {lessons: [{week_no, term, no_lessons: 0, lesson: []}]}}, {new: true}
    // ).lean();

    const subject = await Subject.findOne({ class_name, subject_name, is_deleted: false });

    if (!subject)
      return res.status(400).send({ status: "ok", msg: "Subject not found" });

    // if(subject.lessons.length)
    let lesson_found = false;
    for (let i = 0; i < subject.lessons.length; i++) {
      if (subject.lessons[i]["week_no"] == week_no && subject.lessons[i].term == term) {
        // return res
        //   .status(400)
        //   .send({ status: "error", msg: "Lesson already exists" });
        lesson_found = true;
      }
    }

    if (!lesson_found) {
      subject.lessons.push({ week_no, term, no_lessons: 0, lesson: [] });

      await subject.save();
    }

    return res.status(200).send({ status: "ok", msg: "success", subject, count: subject.lessons.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to add class video or class note lesson materials
router.post(
  "/add_lesson_materials",
  upload.array("lesson-materials"),
  async (req, res) => {
    const {
      token,
      lesson_no,
      lesson_type,
      description,
      title,
      class_name,
      subject_name,
      week_no,
      term,
      session,
      duration,
    } = req.body;

    // check for required fields
    if (
      !token ||
      !week_no ||
      !term ||
      !lesson_no ||
      !lesson_type ||
      !description ||
      !class_name ||
      !subject_name ||
      !title ||
      req.files == null ||
      req.files == undefined
    )
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      // update the lessons field of the particular subject document
      const subject = await Subject.findOne({ subject_name, class_name, is_deleted: false });

      //check if lesson already exists
      let lesson_found = false;
      subject.lessons.forEach((element) => {
        if (element.week_no == week_no && element.term === term) {
          element.lesson.forEach((e) => {
            if (e.lesson_no == lesson_no && e.lesson_type == lesson_type) {
              lesson_found = true;
              return;  // Exit the inner loop if the lesson is found
            }
          });

          if (lesson_found) {
            return res
              .status(400)
              .send({ status: "error", msg: "Lesson already exists" });
          }
        }
      });

      // upload profile file
      let lesson_url = "";
      let lesson_id = "";
      let thumbnail_id = "";
      let thumbnail_url = "";

      for (let i = 0; i < req.files.length; i++) {
        let ext = path.extname(req.files[i].originalname);
        if (ext == ".pdf") {
          const result = await cloudinary.uploader.upload(req.files[i].path, {
            folder: "lesson materials",
          });
          lesson_url = result.secure_url;
          lesson_id = result.public_id;
        }
        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif") {
          const result = await cloudinary.uploader.upload(req.files[i].path, {
            folder: "lesson materials",
          });
          thumbnail_url = result.secure_url;
          thumbnail_id = result.public_id;
        }
        if (ext == ".mkv" || ext == ".mp4") {
          const result = await cloudinary.uploader.upload(req.files[i].path, {
            folder: "lesson materials",
            resource_type: "video",
            chunk_size: 6000000,
          });
          lesson_url = result.secure_url;
          lesson_id = result.public_id;
        }
      }

      // subject.lessons.forEach((element) => {
      //   if (element.week_no == week_no && element.term === term) {
      //     element.lesson.push({
      //       title,
      //       lesson_url,
      //       lesson_id,
      //       lesson_no,
      //       lesson_type,
      //       duration: duration || "",
      //       thumbnail_url: thumbnail_url || "",
      //       thumbnail_id: thumbnail_id || "",
      //       description,
      //     });
      //     element.no_lessons++;
      //     subject.total_no_lessons++;
      //   }
      // });

      subject.lessons.forEach((element) => {
        if (element.week_no == week_no && element.term === term) {
          element.lesson.push({
            title,
            lesson_url,
            lesson_id,
            lesson_no,
            lesson_type,
            duration: duration || "",
            thumbnail_url: thumbnail_url || "",
            thumbnail_id: thumbnail_id || "",
            description,
          });
          element.no_lessons++;
          subject.total_no_lessons++;
        }
      });

      await subject.save();

      return res.status(200).send({ status: "ok", msg: "success", subject });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to edit lesson material
// the lesson_url is the lesson_url field in the lesson object that is to be updated
// the week_no field is the week no of the lesson that is being edited
router.post(
  "/edit_lesson_material",
  upload.array("lesson-materials"),
  async (req, res) => {
    const {
      token,
      subject_id,
      week_no,
      term,
      lesson_url,
      lesson_type,
      title,
      duration,
      description,
    } = req.body;

    // check for required fields
    if (
      !token ||
      !subject_id ||
      !week_no ||
      !term ||
      !lesson_url ||
      !lesson_type
    )
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      // fetch subject document
      const subject = await Subject.findOne({
        _id: subject_id,
        "lessons.week_no": week_no,
        "lessons.term": term,
      });
      if (!subject)
        return res
          .status(403)
          .send({ status: "ok", msg: "no lesson at the moment" });

      let lesson_urlM = "";
      let lesson_idM = "";
      let img_id = "";
      let img_url = "";
      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          if (lesson_type.toLocaleLowerCase() == "class note") {
            const result = await cloudinary.uploader.upload(req.files[i].path, {
              folder: "lesson materials",
            });
            let ext = path.extname(req.files[i].originalname);
            console.log(ext);
            if (ext == ".pdf") {
              lesson_urlM = result.secure_url;
              lesson_idM = result.public_id;
            } else {
              img_url = result.secure_url;
              img_id = result.public_id;
            }
          } else {
            const result = await cloudinary.uploader.upload(req.files[i].path, {
              folder: "lesson materials",
              resource_type: "video",
              chunk_size: 6000000,
            });
            lesson_urlM = result.secure_url;
            lesson_idM = result.public_id;
          }
        }
      }

      // edit the lesson object from lessons array
      let lesson_id = "";
      subject.lessons.forEach((element, index) => {
        if (element.week_no === week_no) {
          element.lesson.forEach((element2, index2) => {
            if (element2.lesson_url == lesson_url) {
              lesson_id = element.lesson_id;
              element2.lesson_url = lesson_urlM || element2.lesson_url;
              element2.lesson_id = lesson_idM || element2.lesson_id;
              element2.thumbnail_id = img_id || element2.thumbnail_id;
              element2.thumbnail_url = img_url || element2.thumbnail_url;
              element2.title = title || element2.title;
              element2.duration = duration || element2.duration;
              element2.description = description || element2.description;
            }
          });
        }
      });
      await subject.save();

      return res.status(200).send({ status: "ok", msg: "success", subject });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to delete lesson material
router.post("/delete_lesson_material", async (req, res) => {
  const {
    token,
    subject_id,
    week_no,
    term,
    lesson_id,
    lesson_material_id,
    thumbnail_id,
  } = req.body;

  // check for required fields
  if (
    !token ||
    !subject_id ||
    !week_no ||
    !term ||
    !lesson_material_id ||
    !lesson_id
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    // let subject = await Subject.findOne({
    //   _id: subject_id
    //   // "lessons.week_no": week_no,
    //   // "lessons.term": term,
    // });

    let subject = await Subject.findOneAndUpdate(
      { "lessons.lesson._id": lesson_id },
      {
        $pull: { "lessons.$.lesson": { _id: lesson_id } },
        $inc: { total_no_lessons: -1 },
        $inc: { "lessons.$.no_lessons": -1 }
      },
      { new: true }
    );

    subject = await Subject.findOneAndUpdate(
      { _id: subject_id },
      {
        $inc: { total_no_lessons: -1 },
      },
      { new: true }
    );

    // return updatedDoc;

    if (!subject)
      return res.status(403).send({ status: "ok", msg: "Subject not found" });

    // delete lesson object from lessons array
    // let lesson_id = "";
    // let thumbnail_id = "";

    // function deleteLessonById(doc, lessonIdToDelete) {
    //   // Create a deep copy of the original object
    //   const updatedDoc = JSON.parse(JSON.stringify(doc));

    //   // Iterate through weeks and lessons to find and remove the lesson
    //   for (let i = 0; i < updatedDoc.lessons.length; i++) {
    //     const week = updatedDoc.lessons[i];
    //     week.lesson = week.lesson.filter(
    //       (lesson) => lesson._id !== lessonIdToDelete
    //     );
    //   }

    //   return updatedDoc;
    // }

    // let solution = deleteLessonById(subject, lesson_id);

    // solution.lessons.forEach((element) => {
    //   if (element.week_no == week_no && element.term === term) {
    //     element.no_lessons--;
    //     solution.total_no_lessons--;
    //   }
    // });

    // subject = solution;

    // await subject.save();

    // subject.lessons.forEach((element) => {
    //   if (element.week_no == week_no && element.term === term) {
    //     element.lesson.push({
    //       title,
    //       lesson_url,
    //       lesson_id,
    //       lesson_no,
    //       lesson_type,
    //       duration: duration || "",
    //       thumbnail_url: thumbnail_url || "",
    //       thumbnail_id: thumbnail_id || "",
    //       description,
    //     });
    //     element.no_lessons++;
    //     subject.total_no_lessons++;
    //   }
    // });

    // let i = -1;

    // console.log(subject.lessons[1].lesson);
    // subject.lessons.forEach((element, index) => {
    //   if (week_no == element.week_no && term === element.term) {
    //     element.lesson.forEach((element2, index2) => {
    //       if (element2.lesson_url == lesson_url) {
    //         lesson_id = element2.lesson_id;
    //         thumbnail_id = element2.thumbnail_id ? element2.thumbnail_id : "";
    //         subject.lessons[index].lesson.splice(index2, 1);
    //         subject.total_no_lessons--;
    //         element.no_lessons--;
    //       }
    //     });
    //   }
    // });

    //delete material from cloudinary
    await cloudinary.uploader.destroy(lesson_material_id);
    if (thumbnail_id) {
      await cloudinary.uploader.destroy(thumbnail_id);
    }

    // await subject.save();

    return res.status(200).send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view lessons based on week and term
router.post("/view_lesson", async (req, res) => {
  const { token, subject_id, week_no, term } = req.body;

  // check for required fields
  if (!token || !subject_id || !week_no || !term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const subject = await Subject.findOne({
      _id: subject_id,
    }).lean();

    if (!subject)
      return res.status(403).send({
        status: "ok",
        msg: "Subject not found",
        lesson: { lessons: [] },
      });

    let subjectM;
    let count = 0;
    subject.lessons.forEach((element) => {
      if (element.week_no == week_no && element.term === term) {
        subjectM = element;
        count++;
      }
    });

    if (!subjectM)
      return res.status(403).send({
        status: "ok",
        msg: "no lesson at the moment",
        lesson: { lessons: [] },
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", lesson: subjectM });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to lock lesson video
router.post("/lock_lesson", async (req, res) => {
  const { token, subject_id, week_no, term } = req.body;

  // check for required fields
  if (!token || !subject_id || !week_no || !term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const subject = await Subject.findOneAndUpdate({
      _id: subject_id,
      "lessons.week_no": week_no,
      "lessons.term": term,
    }, { "lessons.$.locked": true }, { new: true });

    if (!subject)
      return res.status(403).send({
        status: "ok",
        msg: "Subject not found",
        lesson: { lessons: [] },
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to lock lesson video
router.post("/unlock_lesson", async (req, res) => {
  const { token, subject_id, week_no, term } = req.body;

  // check for required fields
  if (!token || !subject_id || !week_no || !term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const subject = await Subject.findOneAndUpdate({
      _id: subject_id,
      lessons: {
        $elemMatch: {
          week_no: week_no,
          term: term,
        }
      }
    }, { "lessons.$.locked": false }, { new: true }).lean();

    if (!subject)
      return res.status(403).send({
        status: "ok",
        msg: "Subject not found",
        lesson: { lessons: [] },
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", subject });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to upload file
router.post("/upload_file", upload.single("lessons"), async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token || req.file === undefined || req.file === null)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    wt.verify(token, process.env.JWT_SECRET);

    // upload files
    let url = "";
    let id = "";
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "lessons",
    });
    url = result.secure_url;
    id = result.public_id;

    return res
      .status(200)
      .send({ status: "ok", msg: "success", lesson: { url, id } });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to upload video
router.post("/upload_video", upload.single("lessons"), async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token || req.file === undefined || req.file === null)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // upload video
    let video_url = "";
    let video_id = "";
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "vlog-videos",
      resource_type: "video",
      chunk_size: 6000000,
    });
    console.log(result);
    video_url = result.secure_url;
    video_id = result.public_id;

    return res
      .status(200)
      .send({ status: "ok", msg: "success", video_id, video_url });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// fetch document
router.post("/view_documents", async (req, res) => {
  const { term } = req.body;

  // check for required fields
  if (!term)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {

    // const subjects = await Subject.find({
    //   "lessons.$.term": term
    // }).lean();

    const subjects = await Subject.find({
      lessons: {
        $elemMatch: { term: term }
      }
    }).lean();


    if (subjects.length === 0)
      return res.status(403).send({
        status: "ok",
        msg: "Subject not found",
        lesson: { lessons: [] },
      });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", subjects, count: subjects.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
