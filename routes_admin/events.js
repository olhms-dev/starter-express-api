const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const Event = require("../models/events");

const yearChecker = require('../functions/yearChecker');

dotenv.config();
const router = express.Router();

/**
 * Endpoint to create an event
 * @param {Number} term 1 for first term, 2 for second term, 3 for third term
 */
router.post(
  "/create_event",
  upload.single("event-images"),
  async (req, res) => {
    const {
      token,
      event_name,
      month,
      event_date,
      event_time,
      category,
      description,
      term
    } = req.body;

    // check for required fields
    if (
      !token ||
      !event_name ||
      !event_date ||
      !event_time ||
      !category ||
      !description ||
      !month || !term
    )
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });

    try {
      // verify token
      // const Admin = jwt.verify(token, process.env.JWT_SECRET);
      // // upload profile picture
      let img_url = "";
      let img_id = "";
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "event-images",
        });
        console.log(result);
        img_url = result.secure_url;
        img_id = result.public_id;
      }

      let termM = "";
      if(term === "First Term") {
        termM = 1;
      } else if (term === "Second Term") {
        termM = 2;
      } else {
        termM = 3;
      }

      // create a new event document and populate it
      let event = new Event();
      event.event_name = event_name;
      event.event_date = event_date;
      event.event_time = event_time;
      event.month = month;
      event.category = category;
      event.description = description;
      event.term = termM;
      event.img_url = img_url || "";
      event.img_id = img_id || "";
      event.timestamp = Date.now();

      await event.save();

      return res.status(200).send({ status: "ok", msg: "Success", event });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  }
);

// endpoint to edit event
router.post("/edit_event", upload.single("event-images"), async (req, res) => {
  const {
    token,
    event_name,
    event_date,
    event_time,
    month,
    category,
    description,
    event_id,
  } = req.body;

  // check for required fields
  if (!token || !event_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);
    // upload profile picture
    let event = await Event.findById({ _id: event_id }).lean();
    let img_url = "";
    let img_id = "";
    if (req.file) {
      if (event.img_id != "") {
        await cloudinary.uploader.destroy(event.img_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "event-images",
      });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // fetch and update document
    event = await Event.findByIdAndUpdate(
      { _id: event_id },
      {
        event_name: event_name || event.event_name,
        event_date: event_date || event.event_date,
        event_time: event_time || event.event_time,
        month: month || event.month,
        category: category || event.category,
        img_url: img_url || event.img_url,
        img_id: img_id || event.img_id,
        description: description || event.description,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", event });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view event
router.post("/view_event", async (req, res) => {
  const { event_id } = req.body;

  // check for required fields
  if (!event_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch event document
    const event = await Event.findById({ _id: event_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success", event });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

/**
 * Endpoint to view events 
 * This endpoint has been tweaked to view the events for that year
 * It will be revamped later on
 */
router.post("/view_events", async (req, res) => {
  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch event document
    const events = await Event.find(
      { is_deleted: false, category: "events" },
      { is_deleted: 0, img_id: 0 }
    ).sort({ timestamp: -1 }).lean();

    // check if events exist
    if (events.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no events at the moment", count: 0 });

    const eventsM = [];

    // check the event date and return events for the current year
    events.forEach(event => {
      if (yearChecker(event.event_date)) {
        eventsM.push(event);
      }
    });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", events: eventsM, count: eventsM.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});


// endpoint to view events based on month
router.post("/view_events", async (req, res) => {
  const { month } = req.body;

  // check for required fields
  if (!month)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch event document
    const events = await Event.find(
      { is_deleted: false, month, category: "events" },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if events exist
    if (events.length === 0)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: `no event for this month ${month} found`,
          count: 0,
        });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", events, count: events.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

/**
 * Endpoint to view events based on term
 * @param {Number} term 1 for first term 2 for second term and three for third term
 */
router.post("/view_term_events", async (req, res) => {
  const { term } = req.body;

  // check for required fields
  if (!term)
    return res.status(400).send({ status: 'error', msg: "all fields must be filled" });
  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch event document
    const events = await Event.find(
      { is_deleted: false, category: "events", term },
      { is_deleted: 0, img_id: 0 }
    ).sort({ timestamp: -1 }).lean();

    // check if events exist
    if (events.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no events at the moment", count: 0 });

    const eventsM = [];

    // check the event date and return events for the current year
    events.forEach(event => {
      if (yearChecker(event.event_date)) {
        eventsM.push(event);
      }
    });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", events: eventsM, count: eventsM.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

router.post('/search_events', async (req, res) => {
  const { token, search_string, pagec } = req.body;

  if (!token || !search_string || search_string == '' || search_string == undefined) {
    return res.status(400).send({ status: 'error', msg: 'All fields must be entered' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const resultsPerPage = 1000;
    let page = pagec >= 1 ? pagec : 1;
    page = page - 1;

    // exclude other fields in the document

    const events = await Event.find({
      '$or': [
        { event_name: new RegExp(search_string, 'i') },
        { description: new RegExp(search_string, 'i') }
      ]
    })
      .sort({ timestamp: "desc" })
      .limit(resultsPerPage)
      .skip(resultsPerPage * page)
      .lean();

    if (events.length === 0) {
      return res.status(200).send({ status: 'ok', msg: 'No events found', count: events.length, events });
    }

    return res.status(200).send({ status: 'ok', msg: 'Success', count: events.length, events });

  } catch (e) {
    console.log(e);
    return res.status(400).send({ status: 'error', msg: e });
  }

});

// endpoint to delete event
router.post("/delete_event", async (req, res) => {
  const { token, event_id } = req.body;

  // check for required fields
  if (!token || !event_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    // const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch event document
    await Event.updateOne({ _id: event_id }, { is_deleted: true }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// // update event document
// router.post('/update_document', async (req, res) => {
//   try {
//     const events = await Event.find({}, { event_date: 1 });
//     for (i = 0; i < events.length; i++) {
//       if (yearChecker(events[i].event_date)) {
//         events[i].term = 2;
//       } else {
//         events[i].term = 1;
//       }
//       events[i].save();
//     }
//     return res.status(200).send({ status: 'ok', events });
//   } catch (e) {
//     console.log(e);
//     return res.status(500).send({ msg: "some error occurred" });
//   }
// });

module.exports = router;
