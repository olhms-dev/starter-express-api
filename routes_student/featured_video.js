const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const FeaturedVideo = require("../models/featured_video");

dotenv.config();
const router = express.Router();

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

module.exports = router;