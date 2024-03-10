const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Notification = require('../models/notification');

dotenv.config();
const router = express.Router();

// endpoint to view notification
router.post('/view_notification', async (req, res) => {
    const {token, notification_id} = req.body;

    // check for required fields
    if(!token || !notification_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch notification document
        const notification = await Notification.findById({_id: notification_id}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', notification});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view notifications
router.post('/view_notifications', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        let user = jwt.verify(token, process.env.JWT_SECRET);

        // fetch notification document
        const notifications = await Notification.find({is_deleted: false, receiver_id: user._id}).lean();

        // check if notifications exist
        if(notifications.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no notifications at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', notifications, count: notifications.length});


    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to delete notifications
router.post('/delete_notification', async (req, res) => {
    const {token, notification_id} = req.body;

    // check for required fields
    if(!token || !notification_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch notification document
        await Notification.findByIdAndUpdate({_id: notification_id}, {is_deleted: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success'});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;