const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Gallery = require("../models/gallery");

dotenv.config();
const router = express.Router();

// create gallery
router.post("/create_gallery", upload.array("gallery"), async (req, res) => {
  const { token, gallery_name, type, img_url, img_id, duration } = req.body;

  // check for required fields
  if (
    !token ||
    !gallery_name ||
    !type ||
    req.files === undefined ||
    req.files === null
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);
    //upload files
    const urls = [];
    const ids = [];

    for (let i = 0; i < req.files.length; i++) {
      let result = await cloudinary.uploader.upload(req.files[i].path, {
        folder: "gallery",
        quality: "auto",
        fetch_format: "auto",
      });
      urls.push(result.secure_url);
      ids.push(result.public_id);
    }

    // check if gallery exists and update gallery document conditionally
    let galleryM = '';
    for (let i = 0; i < urls.length; i++) {
      galleryM = await Gallery.findOneAndUpdate(
        { gallery_name },
        {
          $push: { urls: urls[i], ids: ids[i] }
        },
        { new: true }
      ).lean();
    }
    if (galleryM)
      return res.status(200).send({ status: "ok", msg: "Success", gallery: galleryM});

    // create a new gallery document and populate it
    let gallery = new Gallery();
    gallery.gallery_name = gallery_name;
    gallery.type = type;
    gallery.urls = urls;
    gallery.ids = ids;
    gallery.img_url = img_url || "";
    gallery.img_id = img_id || "";
    gallery.duration = duration || "";
    gallery.timestamp = Date.now();

    await gallery.save();

    return res.status(200).send({ status: "ok", msg: "Success", gallery });

  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// create gallery
router.post(
  "/create_video_gallery",
  upload.single("gallery"),
  async (req, res) => {
    const { token, type, img_url, img_id, duration } = req.body;

    // check for required fields
    if (!token || !type || req.file === undefined || req.file === null)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      const Admin = jwt.verify(token, process.env.JWT_SECRET);
      //upload files
      const urls = [];
      const ids = [];

      let video_url = "";
      let video_id = "";
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gallery",
        resource_type: "video",
        chunk_size: 6000000,
      });
      video_url = result.secure_url;
      video_id = result.public_id;

      // create a new gallery document and populate it
      let gallery = new Gallery();
      gallery.gallery_name = "";
      gallery.type = type;
      gallery.urls = [video_url];
      gallery.ids = [video_id];
      gallery.img_url = img_url || "";
      gallery.img_id = img_id || "";
      gallery.duration = duration || "";
      gallery.timestamp = Date.now();

      await gallery.save();

      return res.status(200).send({ status: "ok", msg: "Success", gallery });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to edit gallery
router.post("/edit_gallery", upload.array("gallery"), async (req, res) => {
  const { token, gallery_name, gallery_id } = req.body;

  // check for required fields
  if (!token || !gallery_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    //upload files conditionally
    const urls = [];
    const ids = [];

    if (req.files) {
      if (req.files.length != 0) {
        for (let i = 0; i < req.files.length; i++) {
          let result = await cloudinary.uploader.upload(req.files[i].path, {
            folder: "gallery",
            quality: "auto",
            fetch_format: "auto",
          });
          urls.push(result.secure_url);
          ids.push(result.public_id);
        }
      }
    }

    // fetch and update document
    let gallery = await Gallery.findById({ _id: gallery_id }).lean();
    const urlsM = gallery.urls.concat(urls);
    const idsM = gallery.ids.concat(ids);
    gallery = await Gallery.findByIdAndUpdate(
      { _id: gallery_id },
      {
        gallery: gallery_name || gallery.gallery_name,
        urls: urlsM || gallery.urls,
        ids: idsM || gallery.ids,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", gallery });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete a file
router.post("/delete_file", async (req, res) => {
  const { token, deleted_ids, ids, urls, gallery_id, type , cover_img_ids} = req.body;

  // check for required fields
  if (!token || !gallery_id || !deleted_ids)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    if(type == 'image'){
        // delete files on cloudinary
      await cloudinary.uploader.destroy(deleted_ids[0]);

      // fetch and update document
      const gallery = await Gallery.findByIdAndUpdate(
        { _id: gallery_id },
        {
          urls: urls,
          ids: ids,
        },
        { new: true }
      ).lean();

      return res.status(200).send({ status: "ok", msg: "Success", gallery });
    }

    if(type == 'video'){
        // delete files on cloudinary
        await cloudinary.uploader.destroy(deleted_ids[0]);
        if(cover_img_ids[0] != ''){
          await cloudinary.uploader.destroy(cover_img_ids[0]); 
        }

        // fetch and update document
        await Gallery.deleteOne(
          { _id: gallery_id }
        ).lean();

        return res.status(200).send({ status: "ok", msg: "Success" });
    }
    

    
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view single gallery
router.post("/view_single_gallery", async (req, res) => {
  const { gallery_id } = req.body;

  // check for required fields
  if (!gallery_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // fetch gallery document
    const gallery = await Gallery.findById(
      { _id: gallery_id },
      { timestamp: 0 }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", gallery });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view all gallery
router.post("/view_all_gallery", async (req, res) => {
  try {
    // fetch gallery document
    const gallery = await Gallery.find(
      { is_deleted: false }
    ).lean();

    // check if gallerys exist
    if (gallery.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no gallerys at the moment", count: 0, gallery: []});

    return res
      .status(200)
      .send({ status: "ok", msg: "success", gallery, count: gallery.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete gallery
router.post("/delete_gallery", async (req, res) => {
  const { token, gallery_id } = req.body;

  // check for required fields
  if (!token || !gallery_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch gallery document
    await Gallery.updateOne({ _id: gallery_id }, { is_deleted: true }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
