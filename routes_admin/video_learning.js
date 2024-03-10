const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const VideoLearning = require("../models/video_learning");

dotenv.config();
const router = express.Router();

// create video_learning
router.post(
  "/create_video_learning",
  upload.single("video_learning-videos"),
  async (req, res) => {
    const { token, title, summary, img_url } = req.body;

    // check for required fields
    if (
      !token ||
      !title ||
      !summary ||
      req.file == undefined ||
      req.file == null || !img_url
    )
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      // upload profile picture
      let video_url = "";
      let video_id = "";
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "video_learning-videos",
        resource_type: "video",
        chunk_size: 6000000,
      });
      video_url = result.secure_url;
      video_id = result.public_id;

      // create a new video_learning document and populate it
      let video_learning = new VideoLearning();
      video_learning.title = title;
      video_learning.img_url = img_url;
      video_learning.summary = summary;
      video_learning.video_url = video_url;
      video_learning.video_id = video_id;
      video_learning.timestamp = Date.now();

      await video_learning.save();

      return res
        .status(200)
        .send({ status: "ok", msg: "Success", video_learning });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to edit video_learning
router.post(
  "/edit_video_learning",
  upload.single("video_learning-videos"),
  async (req, res) => {
    const { token, summary, title, video_learning_id } = req.body;

    // check for required fields
    if (!token || !video_learning_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      // upload profile picture
      let video_learning = await VideoLearning.findById({
        _id: video_learning_id,
      }).lean();
      let video_url = "";
      let video_id = "";
      if (req.file) {
        if (video_learning.video_id != "") {
          await cloudinary.uploader.destroy(video_learning.video_id);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "video_learning-videos",
          resource_type: "video",
          chunk_size: 6000000,
        });
        console.log(result);
        video_url = result.secure_url;
        video_id = result.public_id;
      }

      // fetch and update document
      video_learning = await VideoLearning.findByIdAndUpdate(
        { _id: video_learning_id },
        {
          summary: summary || video_learning.summary,
          title: title || video_learning.title,
          video_url: video_url || video_learning.video_url,
          video_id: video_id || video_learning.video_id,
        },
        { new: true }
      ).lean();

      return res
        .status(200)
        .send({ status: "ok", msg: "Success", video_learning });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to view video_learning
router.post("/view_video_learning", async (req, res) => {
  const { video_learning_id } = req.body;

  // check for required fields
  if (!video_learning_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // fetch video_learning document
    const video_learning = await VideoLearning.findById({
      _id: video_learning_id,
    }).lean();

    return res
      .status(200)
      .send({ status: "ok", msg: "Success", video_learning });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view video_learnings
router.post("/view_video_learnings", async (req, res) => {
  const { pagec } = req.body;

  // check for required fields
  if (!pagec)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    const resultsPerPage = 15;
    let page = pagec >= 1 ? pagec : 1;
    page = page - 1;

    // fetch video_learning documents
    const video_learnings = await VideoLearning.find(
      { is_deleted: false },
      { is_deleted: 0, video_id: 0 }
    )
      .sort({ timestamp: "desc" })
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

    // check if video_learnings exist
    if (video_learnings.length === 0)
      return res.status(200).send({
        status: "ok",
        msg: "no video_learnings at the moment",
        count: 0,
      });

    return res.status(200).send({
      status: "ok",
      msg: "success",
      video_learnings,
      count: video_learnings.length,
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

router.post('/search_video_learnings', async (req, res) => {
  const {token, search_string, pagec} = req.body;

  if(!token || !search_string || search_string == '' || search_string == undefined){
      return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
  }

  try{
      jwt.verify(token, process.env.JWT_SECRET);

      const resultsPerPage = 1000;
      let page = pagec >= 1 ? pagec : 1;
      page = page -1;

      // exclude other fields in the document

      const video_learnings = await VideoLearning.find({
          '$or': [
          {title: new RegExp(search_string, 'i')},
          {summary: new RegExp(search_string, 'i')}
      ]})
      .sort({timestamp: "desc"})
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

      if(video_learnings.length === 0){
          return res.status(200).send({status: 'ok', msg: 'No video_learnings found', count: video_learnings.length, video_learnings});
      }

      return res.status(200).send({status: 'ok', msg: 'Success', count: video_learnings.length, video_learnings});

  }catch (e){
      console.log(e);
      return res.status(400).send({status: 'error', msg: e});
  }

});

// view video learnings based on views
router.post("/view_video_learnings_based_on_view_count", async (req, res) => {
  const { pagec } = req.body; // page count

  // check for required fields
  if (!pagec)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    const resultsPerPage = 15;
    let page = pagec >= 1 ? pagec : 1;
    page = page - 1;

    // fetch video_learning documents
    const video_learnings = await VideoLearning.find(
      { is_deleted: false },
      { is_deleted: 0, timestamp: 0, video_id: 0 }
    )
      .sort({ view_count: "desc" })
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

    // check if video_learnings exist
    if (video_learnings.length === 0)
      return res.status(200).send({
        status: "ok",
        msg: "no video_learnings at the moment",
        count: 0,
      });

    return res.status(200).send({
      status: "ok",
      msg: "success",
      video_learnings,
      count: video_learnings.length,
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete video_learning
router.post("/delete_video_learning", async (req, res) => {
  const { token, video_learning_id } = req.body;

  // check for required fields
  if (!token || !video_learning_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch video_learning document
    await VideoLearning.updateOne(
      { _id: video_learning_id },
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

// endpoint to upload file
router.post("/upload_file", upload.single("video-images"), async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token || req.file === undefined || req.file === null)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // upload files
    let url = "";
    let id = "";
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "video-images",
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

module.exports = router;