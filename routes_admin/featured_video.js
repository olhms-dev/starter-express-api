const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require('path');

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const FeaturedVideo = require("../models/featured_video");

dotenv.config();
const router = express.Router();

// create featured_video
router.post(
  "/create_featured_video",
  upload.array("featured_video"),
  async (req, res) => {
    const { token, video_link } = req.body;

    // check for required fields
    if (!token)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      let video_url = "";
      let video_id = "";
      let img_url = "";
      let img_id = "";
      
      if(req.files != null || req.files != undefined){
        for (let i = 0; i < req.files.length; i++) {
          let ext = path.extname(req.files[i].originalname);
          
          if(ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') {
            const result = await cloudinary.uploader.upload(req.files[i].path, {folder: "featured-video"});
            img_url = result.secure_url;
            img_id = result.public_id;
          }
          if(ext == '.mkv' || ext == '.mp4') {
            const result = await cloudinary.uploader.upload(req.files[i].path, {folder: "featured-video", resource_type: "video", chunk_size: 6000000});
            video_url = result.secure_url;
            video_id = result.public_id;
          }
        }
      }
      // const result = await cloudinary.uploader.upload(req.file.path, {
      //   folder: "featured-video",
      //   resource_type: "video",
      //   chunk_size: 6000000,
      // });
      // video_url = result.secure_url;
      // video_id = result.public_id;

      // create a new featured_video document and populate it
      let featured_video = new FeaturedVideo();
      featured_video.video_link = video_link || "";
      featured_video.video_url = video_url;
      featured_video.video_id = video_id;
      featured_video.img_url = img_url;
      featured_video.img_id = img_id;
      featured_video.timestamp = Date.now();

      await featured_video.save();

      return res.status(200).send({ status: "ok", msg: "Success", featured_video });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e: e.toString() });
    }
  }
);

// endpoint to view single featured_video
router.post("/view_single_featured_video", async (req, res) => {
  const { featured_video_id } = req.body;

  // check for required fields
  if (!featured_video_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // fetch featured_video document
    const featured_video = await FeaturedVideo.findById(
      { _id: featured_video_id }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", featured_video });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view all featured_video
router.post("/view_all_featured_video", async (req, res) => {
  try {
    // fetch featured_video document
    const featured_video = await FeaturedVideo.find(
      { is_deleted: false },
      { is_deleted: 0, timestamp: 0, video_id: 0, img_id: 0 }
    ).lean();

    // check if featured_videos exist
    if (featured_video.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no featured_videos at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", featured_video, count: featured_video.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete featured video
router.post("/delete_featured_video", async (req, res) => {
  const { token, video_id, img_id, featured_video_id } = req.body;

  // check for required fields
  if (!token || !featured_video_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // delete files on cloudinary
    if(video_id){
      await cloudinary.uploader.destroy(video_id);
    }
    if(img_id)
      await cloudinary.uploader.destroy(img_id);

    // delete document
    await FeaturedVideo.deleteOne({ _id: featured_video_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success" });

  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
