const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Vlog = require("../models/vlog");

dotenv.config();
const router = express.Router();

// create vlog
router.post("/create_vlog", upload.single("vlog-videos"), async (req, res) => {
  const { token, title, category, summary, preview, duration, img_url } = req.body;

  // check for required fields
  if (
    !token ||
    !title ||
    !category ||
    !duration ||
    !preview ||
    !summary ||
    req.file == undefined ||
    req.file == null ||
    !img_url
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
      folder: "vlog-videos",
      resource_type: "video",
      chunk_size: 6000000,
    });
    video_url = result.secure_url;
    video_id = result.public_id;

    // create a new vlog document and populate it
    let vlog = new Vlog();
    vlog.title = title;
    vlog.category = category;
    vlog.summary = summary;
    vlog.preview = preview;
    vlog.duration = duration;
    vlog.img_url = img_url;
    vlog.video_url = video_url;
    vlog.video_id = video_id;
    vlog.timestamp = Date.now();

    await vlog.save();

    return res.status(200).send({ status: "ok", msg: "Success", vlog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit vlog
router.post("/edit_vlog", upload.single("vlog-videos"), async (req, res) => {
  const { token, summary, duration, preview, category, title, vlog_id } =
    req.body;

  // check for required fields
  if (!token || !vlog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // upload profile picture
    let vlog = await Vlog.findById({ _id: vlog_id }).lean();
    let video_url = "";
    let video_id = "";
    if (req.file) {
      if (vlog.video_id != "") {
        await cloudinary.uploader.destroy(vlog.video_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "vlog-videos",
        resource_type: "video",
        chunk_size: 6000000,
      });
      console.log(result);
      video_url = result.secure_url;
      video_id = result.public_id;
    }

    // fetch and update document
    vlog = await Vlog.findByIdAndUpdate(
      { _id: vlog_id },
      {
        vlog: summary || vlog.summary,
        category: category || vlog.category,
        title: title || vlog.title,
        duration: duration || vlog.duration,
        preview: preview || vlog.preview,
        video_url: video_url || vlog.video_url,
        video_id: video_id || vlog.video_id,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", vlog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view vlog
router.post("/view_vlog", async (req, res) => {
  const { vlog_id } = req.body;

  // check for required fields
  if (!vlog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // fetch vlog document
    const vlog = await Vlog.findById({ _id: vlog_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success", vlog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view vlogs
router.post("/view_vlogs", async (req, res) => {
  try {
    // fetch vlog document
    const vlogs = await Vlog.find(
      { is_deleted: false },
      { is_deleted: 0, video_id: 0 }
    ).lean();

    // check if vlogs exist
    if (vlogs.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no vlogs at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", vlogs, count: vlogs.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to search vlogs
router.post('/search_vlogs', async (req, res) => {
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

      const vlogs = await Vlog.find({
          '$or': [
          {title: new RegExp(search_string, 'i')},
          {category: new RegExp(search_string, 'i')},
          {summary: new RegExp(search_string, 'i')}
      ]})
      .sort({timestamp: "desc"})
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

      if(vlogs.length === 0){
          return res.status(200).send({status: 'ok', msg: 'No vlogs found', count: vlogs.length, vlogs});
      }

      return res.status(200).send({status: 'ok', msg: 'Success', count: vlogs.length, vlogs});

  }catch (e){
      console.log(e);
      return res.status(400).send({status: 'error', msg: e});
  }

});

// endpoint to delete vlog
router.post("/delete_vlog", async (req, res) => {
  const { token, vlog_id } = req.body;

  // check for required fields
  if (!token || !vlog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch vlog document
    await Vlog.updateOne({ _id: vlog_id }, { is_deleted: true }).lean();

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

// endpoint to upload video
router.post("/upload_video", upload.single("videos"), async (req, res) => {
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
      folder: "videos",
      resource_type: "video",
      chunk_size: 6000000,
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
