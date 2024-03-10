const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Request = require('../models/request');
const Notification = require('../models/notification');

dotenv.config();
const router = express.Router();

// endoint to notify requester
router.post('/notify_requester', async (req, res) => {
    const {token, requester_id, request_id} = req.body;

    // check for required fields
    if(!token || !requester_id || !request_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const request = await Request.findByIdAndUpdate({_id: request_id}, {ready_to_collect: true}, {new: true}).lean();

        // create notification document
        let notification = new Notification;
        notification.noti_type = 'School Store';
        notification.content = 'This is to inform you that the package you requested is ready to be paid for and collected';
        notification.sender_id = admin._id;
        notification.receiver_ids = [requester_id];
        notification.timestamp = Date.now();

        await notification.save();

        return res.status(200).send({status: 'ok', msg: 'success', request, notification});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to transfer new request to pending request
router.post('/transfer_new_request', async (req, res) => {
    const {token, request_id} = req.body;

    // check for required fields
    if(!token || !request_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const request = await Request.findByIdAndUpdate({_id: request_id}, {new_request: false}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', request});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to mark as paid for and collected
router.post('/mark_request_as_paid', async (req, res) => {
    const {token, collection_date, collector_name, request_id} = req.body;

    // check for required fields
    if(!token || !collection_date || !collector_name || !request_id)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const request = await Request.findByIdAndUpdate({_id: request_id}, {is_collected: true, collection_date, collector_name}, {new: true}).lean();

        return res.status(200).send({status: 'ok', msg: 'success', request});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// endpoint to view new product requests
router.post('/view_new_requests', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const requests = await Request.find({is_deleted: false, new_request: true}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if request documents exist
        if(requests.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no requests at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', requests, count: requests.length});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// view pending requests
router.post('/view_pending_requests', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const requests = await Request.find({is_deleted: false, new_request: false, is_collected: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if request documents exist
        if(requests.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no requests at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', requests, count: requests.length});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

// view collected items
router.post('/view_collected_items', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
 
    try{
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch request document
        const requests = await Request.find({is_deleted: false, is_collected: true}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

        // check if request documents exist
        if(requests.length === 0)
          return res.status(200).send({status: 'ok', msg: 'no collected items at the moment', count: 0});

        return res.status(200).send({status: 'ok', msg: 'success', requests, count: requests.length});

    } catch(e) {
        console.log(e);
        return res.status(500).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router;