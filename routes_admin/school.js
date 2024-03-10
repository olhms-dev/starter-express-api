const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const School = require("../models/school");

dotenv.config();
const router = express.Router();

// endpoint to create school
router.post("/create_school", async (req, res) => {
  const {
    token,
    school_name,
    overview,
    curriculum,
    entry_requirements,
    tuition,
    experience,
  } = req.body;

  // check for required fields
  if (!token || !school_name)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // create school document
    let school = new School();
    school.school_name = school_name;
    school.overview = overview || "";
    school.curriculum = curriculum || "";
    school.entry_requirements = entry_requirements || "";
    school.experience = experience || "";
    school.tuition = tuition || "";
    school.timestamp = Date.now();

    await school.save();

    return res.status(200).send({ status: "ok", msg: "success", school });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit school
router.post("/edit_school", async (req, res) => {
  const {
    token,
    school_id,
    school_name,
    overview,
    curriculum,
    entry_requirements,
    tuition,
    experience,
  } = req.body;

  // check for required fields
  if (!token || !school_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch school document and update accordingly
    let school = await School.findById({ _id: school_id }).lean();

    school = await School.findByIdAndUpdate(
      { _id: school_id },
      {
        school_name: school_name || school.school_name,
        overview: overview || school.overview,
        curriculum: curriculum || school.curriculum,
        entry_requirements: entry_requirements || school.entry_requirements,
        tuition: tuition || school.tuition,
        experience: experience || school.experience,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", school });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to school
router.post("/view_school", async (req, res) => {
  const {school_id} = req.body;

  // check for required fields
  if (!school_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // jwt.verify(token, process.env.JWT_SECRET);

    // fetch school document
    const school = await School.findOne({
      is_deleted: false,
      _id: school_id
    }).lean();

    // check if school documents exist
    if (!school)
      return res.status(200).send({ status: "ok", msg: "school not found" });

    return res.status(200).send({ status: "ok", msg: "success", school });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view schools
router.post("/view_schools", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch school document
    const schools = await School.find({ is_deleted: false }).lean();

    // check if school documents exist
    if (schools.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no schools at the moment", count: 0 });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", schools, count: schools.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
