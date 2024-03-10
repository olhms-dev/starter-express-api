const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const Session = require("../models/session");
const Student = require("../models/student");

dotenv.config();
const router = express.Router();

// endpoint to create session
router.post("/create_session", async (req, res) => {
  const { token, session, admin_name, admin_img, admin_id } = req.body;

  // check for required fields
  if (!token || !session || !admin_name || !admin_img || !admin_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // set previoous sessions current session field to false
    await Session.updateMany(
      { doc_type: "session" },
      { current_session: false }
    ).lean();

    // create session document
    let sessionM = new Session();
    sessionM.doc_type = "session";
    sessionM.session = session;
    sessionM.admin_id = admin_id;
    sessionM.admin_img = admin_img;
    sessionM.admin_name = admin_name;
    sessionM.current_term = "First Term";
    sessionM.next_term_resumption_date = "";
    sessionM.timestamp = Date.now();

    await sessionM.save();

    // update all student documents
    await Student.updateMany(
      { is_deleted: false },
      { current_session: session }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "success", sessionM });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view current session
router.post("/view_current_session", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch session document
    const sessionM = await Session.findOne(
      { is_deleted: false, current_session: true },
      { is_deleted: 0, timestamp: 0 }
    ).lean();

    // check if session exist
    if (!sessionM)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: "no current session at the moment",
          count: 0,
        });

    return res.status(200).send({ status: "ok", msg: "success", sessionM });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to set current term
router.post("/set_current_term", async (req, res) => {
  const { token, current_term, session, admin_name, admin_img, admin_id } =
    req.body;

  // check for required fields
  if (
    !token ||
    !current_term ||
    !session ||
    !admin_name ||
    !admin_img ||
    !admin_id
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // update session document
    const mSession = await Session.findOneAndUpdate(
      { session, current_session: true },
      { current_term, admin_id, admin_name, admin_img, timestamp: Date.now() },
      { new: true, current_term: 1 }
    ).lean();

    // check if session document exists
    if (!mSession)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: "no current session at the moment",
          count: 0,
        });

    // update all student documents
    await Student.updateMany(
      { is_deleted: false },
      { login_code: "not set", current_term }
    ).lean();

    return res
      .status(200)
      .send({
        status: "ok",
        msg: "success",
        current_term: mSession.current_term,
      });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to set next term resumption date
router.post("/set_next_term_resumption_date", async (req, res) => {
  const { token, next_term_resumption_date, session } = req.body;

  // check for required fields
  if (!token || !next_term_resumption_date || !session)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // update session document
    const mSession = await Session.findOneAndUpdate(
      { session, current_session: true },
      { next_term_resumption_date },
      { new: true, next_term_resumption_date: 1 }
    ).lean();

    // check if session document exists
    if (!mSession)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: "no current session at the moment",
          count: 0,
        });

    return res
      .status(200)
      .send({
        status: "ok",
        msg: "success",
        next_term_resumption_date: mSession.next_term_resumption_date,
      });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});
// endpoint to get next term resumption date
router.post("/get_next_term_resumption_date", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // find document
    const mSession = await Session.findOne({ current_session: true }).lean();

    // check if session document exists
    if (mSession.next_term_resumption_date == "")
      return res
        .status(200)
        .send({ status: "ok", msg: "Next resumption date not set yet" });

    return res.status(200).send({
      status: "ok",
      msg: "success",
      next_term_resumption_date: mSession.next_term_resumption_date,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", error: e.toString() });
  }
});


module.exports = router;
