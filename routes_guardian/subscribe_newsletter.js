const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Subscriber = require('../models/subscribers');

dotenv.config();
const router = express.Router();


// endpoint to subscribe to news letter
router.post('/subscribe_newsletter', async (req, res) => {
  const { email } = req.body;

  // check for required fields
  if (!email)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    await Subscriber.updateOne({doc_type: 'subscribe'}, {$push: {
        subscribers: email
    }}, {upsert: true});

    return res.status(200).send({ status: 'ok', msg: 'success'});

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;