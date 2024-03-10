const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const StoreRequest = require("../models/store_request");
const Statistics = require("../models/statistics");
const Notification = require("../models/notification");
const {newStoreItemRequest, notifyStoreItemRequestPending, notifyStoreItemRequestCollected} = require('../utils/nodemailer');

dotenv.config();
const router = express.Router();

// create get in touch
router.post("/store_request", async (req, res) => {
  const { token, student_id, student_name, phone_no, email, admission_year, session, term, student_class, store_items } = req.body;

  // check for required fields
  if (!token || !student_id || !student_name || !phone_no || !email || !admission_year || !session || !term || !student_class || !store_items)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {

    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    const timestamp = Date.now();
    
    let storeRequest = new StoreRequest();

    storeRequest.student_id = student_id;
    storeRequest.student_name = student_name;
    storeRequest.phone_no = phone_no;
    storeRequest.email = email;
    storeRequest.admission_year = admission_year;
    storeRequest.session = session;
    storeRequest.term = term;
    storeRequest.student_class = student_class;
    storeRequest.collector_name = "";
    storeRequest.store_items = store_items;
    storeRequest.request_status = "new";
    storeRequest.timestamp = timestamp;

    storeRequest = await storeRequest.save();

    //increase stats
    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_new_store_requests: 1}});

    // Add email sending to admin email on new store request
    newStoreItemRequest("olhms.dev@gmail.com", student_name, student_id);
    // newStoreItemRequest(email, student_name, student_id);

    return res.status(200).send({ status: "ok", msg: "Success", storeRequest });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view store requests
// by status_request: new, pending, collected
router.post("/get_store_requests", async (req, res) => {

    const {token, request_status, pagec} = req.body;

    if(!token || !request_status || !pagec){
        return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
    }

    try{

    jwt.verify(token, process.env.JWT_SECRET);

    const resultsPerPage = 10;
    let page = pagec >= 1 ? pagec : 1;
    page = page -1;

    const storeRequests = await StoreRequest.find({request_status}).sort({timestamp: "desc"})
    .limit(resultsPerPage)
    .skip(resultsPerPage * page)
    .lean();

    if (storeRequests.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no store requests at the moment", count: 0, storeRequests: [] });
        

    return res
      .status(200)
      .send({ status: "ok", msg: "success", storeRequests, count: storeRequests.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});


// endpoint to search through store requests
router.post('/search_items', async (req, res) => {
    const {token, search_string, request_status, pagec} = req.body;

    if(!token || !search_string || !request_status || search_string == '' || search_string == undefined){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }

    try{
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 10;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        const storeRequests = await StoreRequest.find({
          request_status,
            '$or': [
            {student_id: new RegExp(search_string, 'i')},
            {student_name: new RegExp(search_string, 'i')},
            {phone_no: new RegExp(search_string, 'i')},
            {collector_name: new RegExp(search_string, 'i')}
        ]})
        .sort({timestamp: "desc"})
        .limit(resultsPerPage)
        .skip(resultsPerPage * page)
        .lean();

        if(storeRequests.length === 0){
            return res.status(200).send({status: 'ok', msg: 'No store requests found', count: storeRequests.length, storeRequests});
        }

        return res.status(200).send({status: 'ok', msg: 'Success', count: storeRequests.length, storeRequests});

    }catch (e){
        console.log(e);
        return res.status(400).send({status: 'error', msg: e});
    }

});

router.post("/notify_requester", async (req, res) => {
    const { token, store_request_id} = req.body;
  
    // check for required fields
    if (!token || !store_request_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
  
    try {
  
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      const found = await StoreRequest.findOne({_id: store_request_id}).lean();
        
      if(!found){
        return res
        .status(400)
        .send({ status: "error", msg: `No Store request with id: ${store_request_id} found` });
      }
  
      const timestamp = Date.now();
      
      const storeReq = await StoreRequest.findOneAndUpdate({_id: store_request_id}, {
        request_status: 'pending'
      }, {new: true}).lean();

      if(found.request_status == 'new'){
        await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_pending_store_requests: 1, no_new_store_requests: -1}});
      }

      // send notification to phone
      //______________________________________________-----------

      // send email to requester
      notifyStoreItemRequestPending(storeReq.email, storeReq.student_name);

      return res.status(200).send({ status: "ok", msg: "Success" });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });

  // endpoint to indicate collected
  router.post("/indicate_collected", async (req, res) => {
    const { token, store_request_id, collector_name, guardian_id} = req.body;
  
    // check for required fields
    if (!token || !store_request_id || !collector_name || !guardian_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
  
    try {
  
      // verify token
      let admin = jwt.verify(token, process.env.JWT_SECRET);

      const found = await StoreRequest.findOne({_id: store_request_id}).lean();
        
      if(!found){
        return res
        .status(400)
        .send({ status: "error", msg: `No Store request with id: ${store_request_id} found` });
      }
  
      const timestamp = Date.now();
      
      await StoreRequest.updateOne({_id: store_request_id}, {
        request_status: 'collected',
        collector_date: timestamp,
        collector_name
      }).lean();

      await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_collected_store_requests: 1, no_pending_store_requests: -1}});

      let items = [];
      found.store_items.forEach((element) => {
        items.push(element.product_name);
      });

      // 4tKnight
      let temp_not_content = items.length==1 ? `Your requested item: ${items.join(", ")} is now ready` : `Your requested item(s): ${items.join(", ")} are now ready`;

      let notification = new Notification();
      notification.noti_type = "store_request";
      notification.content = temp_not_content;
      notification.timestamp = Date.now();
      notification.sender_id = admin._id;
      notification.email = found.email;
      // notification.receiver_ids = [guardian_id];
      await notification.save();

      // send notification to phone
      //______________________________________________-----------

      // send email to requester
      notifyStoreItemRequestCollected(found.email, found.student_name);

      return res.status(200).send({ status: "ok", msg: "Success" });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });

module.exports = router;