const express = require('express');
const jwt = require('jsonwebtoken');

const Conversation = require('../models/conversation');
const Admin = require('../models/admin');
const Guardian = require('../models/guardian');
const AdminIds = require('../models/admin_ids');

const router = express.Router();

// get conversations for an admin
router.post('/get_conversations', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token) {
    return res.status(400).json({ status: 'error', msg: 'All fields must be entered' });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findOne({ _id: user._id }).lean();

    if ((admin.status != true) && admin) {
      return res.status(400).send({ status: 'error', msg: 'This admin account has been disabled, please contact the master admin' });
    }

    // check if admin account has access to this operation
    const adminM = await Admin.findOne({ _id: user._id, role: { $all: ['master', 'help_feedback'] } }).lean();

    if (!adminM) {
      return res.status(400).send({ status: 'error', msg: 'You do not have access to this operation, please contact the master admin' });
    }

    const conversations = await Conversation.find(
      { conv_type: 'help_feedback', members: user._id }
    ).sort({ timestamp: "asc" }).lean();

    // fetch admin ids and return the username, image and id of the user
    const admin_ids = await AdminIds.findOne({ doc_type: 'admin_ids' }, { ids: 1 }).lean();
    for (let j = 0; j < conversations.length; j++) {
      for (let i = 0; i < conversations[j].members.length; i++) {
        if (admin_ids.ids.includes(conversations[j].members[i]) === false) {
          const other_user = await Guardian.findById({ _id: conversations[j].members[i] }, { full_name: 1, img_url: 1 }).lean();
          conversations[j].other_username = other_user.full_name;
          conversations[j].other_user_img = other_user.img_url;
          conversations[j].other_user_id = other_user._id;
        }
      }
    }

    // for(let i = 0; i < conversations.length; i++){

    //     let other_user_id;
    //     conversations[i].members.map(id => {
    //         if(id != user._id){
    //             other_user_id = id;
    //         }
    //     });

    //     const otherGuardian = await Guardian.findOne({_id: other_user_id}).lean();

    //     if((otherGuardian != null) && (otherGuardian != undefined)){
    //         conversations[i].other_username = otherGuardian.full_name;
    //         conversations[i].other_user_img = otherGuardian.img_url;
    //     }
    // }

    return res.status(200).send({ status: 'ok', msg: 'Success', count: conversations.length, conversations });

  } catch (e) {
    console.log(e);
    return res.status(400).json({ status: 'error', msg: e });
  }

});

// check if a conversation exists already between the admin and the user
router.post('/check_convers', async (req, res) => {
  const { token, receiver_id } = req.body;

  // check for required fields
  if (!token || !receiver_id) {
    return res.status(400).json({ status: 'error', msg: 'All fields must be entered' });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // check if admin account has access to this operation
    const adminM = await Admin.findOne({ _id: user._id, $or: [{ role: 'help_feedback' }, { role: 'master' }] }).lean();

    if (!adminM) {
      return res.status(400).send({ status: 'error', msg: 'You do not have access to this operation, please contact the master admin' });
    }

    // check if previous conversation exists
    const conversation = await Conversation.findOne(
      { conv_type: 'help_feedback', members: user._id }
    ).lean();

    // check if conveation document exists
    if (!conversation)
      return res.status(200).send({ status: 'ok', msg: 'No conversation found' });

    return res.status(200).send({ status: 'ok', msg: 'Old conversation', conversation_id: conversation._id });

  } catch (e) {
    console.log(e);
    return res.status(400).json({ status: 'error', msg: e });
  }

});


// get conversations for an admin with users
router.post('/get_conversations_users', async (req, res) => {
  const {token} = req.body;

  if(!token){
      return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
  }

  try{
      const user = jwt.verify(token, process.env.JWT_SECRET);

      const admin = await Admin.findOne({_id: user._id}).lean();

      if(admin){
        if(admin.is_deleted == true){
          return res.status(400).send({status: 'error', msg: 'This admin account has been disabled, please contact the master admin'});
        }
      }

      const conversations = await Conversation.find(
          {members: user._id}
      ).sort({timestamp: "asc"}).lean();

      for(let i = 0; i < conversations.length; i++){

          // let other_user_id;
          // conversations[i].members.map(id => {
          //     if(id != user._id){
          //         other_user_id = id;
          //     }
          // });

          for(let j = 0; j < conversations[i].members.length; j++){
              // confirm that the other user is a user and another admin
              const guardians = await Guardian.find({_id: conversations[i].members[j]}).lean();

              if(guardians.length != 0){
                  conversations[i].other_username = guardians[0].fullname;
                  conversations[i].other_user_img = 'a';
                  conversations[i].other_user_email = guardians[0].email;
                  conversations[i].other_user_phone = guardians[0].phone_no;
              }
          }
      }
      
      return res.status(200).send({status: 'ok', msg: 'Success', count: conversations.length, conversations});
      
  }catch(e){
      console.log(e);
      return res.status(400).json({status: 'error', msg: e});
  }

});

module.exports = router;