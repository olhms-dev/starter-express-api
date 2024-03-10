const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const Event = require('../models/events');

const yearChecker = require("../functions/yearChecker");

dotenv.config();
const router = express.Router();


// endpoint to view event
router.post('/view_event', async (req, res) => {
    const {event_id} = req.body;

    // check for required fields
    if(!event_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // fetch event document
        const event = await Event.findById({_id: event_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', event});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view events
router.post('/view_events', async (req, res) => {
    try{
        // fetch event document
        const events = await Event.find({is_deleted: false, category: "events"}, {is_deleted: 0, timestamp: 0, img_id: 0}).sort({timestamp: -1}).lean();

        // check if events exist
        if(events.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no events at the moment', count: 0});

          const eventsM = [];
          // check the event date and return events for the current year
          events.forEach(event => {
              if (yearChecker(event.event_date)) {
                  eventsM.push(event);
              }
          });

          return res.status(200).send({ status: 'ok', msg: 'success', events: eventsM, count: eventsM.length });

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
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

module.exports = router;