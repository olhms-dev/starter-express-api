const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Blog = require("../models/blog");

dotenv.config();
const router = express.Router();

// create blog
router.post("/create_blog", upload.single("blog-images"), async (req, res) => {
  const { token, title, body, duration } = req.body;

  // check for required fields
  if (!token || !title || !body || !duration)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);
    // upload profile picture
    let img_url = "";
    let img_id = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blog-images",
      });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // create a new blog document and populate it
    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.duration = duration;
    blog.img_url = img_url || "";
    blog.img_id = img_id || "";
    blog.timestamp = Date.now();

    await blog.save();

    return res.status(200).send({ status: "ok", msg: "Success", blog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit blog
router.post("/edit_blog", upload.single("blog-images"), async (req, res) => {
  const { token, body, duration, title, blog_id } = req.body;

  // check for required fields
  if (!token || !blog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);
    // upload profile picture
    let blog = await Blog.findById({ _id: blog_id }).lean();
    let img_url = "";
    let img_id = "";
    if (req.file) {
      if (blog.img_id != "") {
        await cloudinary.uploader.destroy(blog.img_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blog-images",
      });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // fetch and update document
    blog = await Blog.findByIdAndUpdate(
      { _id: blog_id },
      {
        blog: body || blog.body,
        duration: duration || blog.duration,
        title: title || blog.title,
        img_url: img_url || blog.img_url,
        img_id: img_id || blog.img_id,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", blog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view blog
router.post("/view_blog", async (req, res) => {
  const { blog_id } = req.body;

  // check for required fields
  if (!blog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // fetch blog document
    const blog = await Blog.findById({ _id: blog_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success", blog });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view blogs
router.post("/view_blogs", async (req, res) => {
  try {
    // fetch blog document
    const blogs = await Blog.find(
      { is_deleted: false },
      { is_deleted: 0, img_id: 0 }
    ).lean();

    // check if blogs exist
    if (blogs.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no blogs at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", blogs, count: blogs.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to search blogs
router.post('/search_blogs', async (req, res) => {
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

      const blogs = await Blog.find({
          '$or': [
          {title: new RegExp(search_string, 'i')},
          {body: new RegExp(search_string, 'i')}
      ]})
      .sort({timestamp: "desc"})
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

      if(blogs.length === 0){
          return res.status(200).send({status: 'ok', msg: 'No blogs found', count: blogs.length, blogs});
      }

      return res.status(200).send({status: 'ok', msg: 'Success', count: blogs.length, blogs});

  }catch (e){
      console.log(e);
      return res.status(400).send({status: 'error', msg: e});
  }

});

// endpoint to delete blog
router.post("/delete_blog", async (req, res) => {
  const { token, blog_id } = req.body;

  // check for required fields
  if (!token || !blog_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch blog document
    await Blog.updateOne({ _id: blog_id }, { is_deleted: true }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
