const express = require('express');
const jwt = require('jsonwebtoken');

const Guardian = require('../models/guardian');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Admin = require('../models/admin');
const AdminIds = require('../models/admin_ids');
const {FsConversation } = require('../services/firebase_service_config');

// const Notification = require('../models/notification');
// const { sendNotificationToDevice } = require('../controllers/push_notification_controller');

const router = express.Router();

// const handleNotification = async (toGuardian, receiver_id, img, notiTitle, notiSubtitle, admin_device_tokens) => {
//   let user;
//   if (toGuardian) {
//     user = await Guardian.findOne({ _id: receiver_id }).lean();
//   }
//   sendNotificationToDevice(toGuardian, toGuardian ? [user.device_token] : admin_device_tokens, img, notiTitle, notiSubtitle);
// }


/**
 * 1. On tap help and feedback, check if any help and feedback conversations
 * exist involving the current user.
 * 
 * 2. if previous conversation exists, load up chats from that conversation
 * and show to the user and continue that conversation with the user.
 * if no previous conversation exists, send an indicator to the front end
 * and new_conv will be set to true.
 * 
 * 3. if help_feedback admin changes, when checking if previous conversation
 * exists, if user_id of the current help_feedback admin is different from the
 * other id in the found conversation, delete current conversation and create
 * a new converstion with recent info.
 * 
 * 4. check if current help_feedback admin's id is what is in conversation
 * each time a conversation is found
 * 
 * 
 */

// send message

// the requester_Id field is optional, it'll have a value if the person initiating
// the chat is an admin, if it's a user, then it will be unnecessary
// who_sent can either be "admin" or "user"
router.post('/send_message', async (req, res) => {
  const { token, sender_name, sender_img, new_conv, conv_id, content, who_sent, requester_id, message_type, file_name } = req.body;

  if (!token || !sender_name || ((new_conv != true) && (new_conv != false)) || !content || !sender_img || !who_sent || !message_type) {
    return res.status(400).json({ status: 'error', msg: 'All fields must be entered' });
  }

  // get timestamp
  const timestamp = Date.now();
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    let conversation_id = conv_id;
    let nConv;

    // fetch admin ids
    const adminM = await AdminIds.findOne({ doc_type: 'admin_ids' }).lean();
    const admin_ids = adminM.ids
    console.log(admin_ids);
    if (new_conv == true) {
      // create new conversation
      const conversation = new Conversation;

      if (who_sent == 'user') {
        const members = admin_ids;
        members.unshift(user._id);
        conversation.members = members;
      } else {
        const members = admin_ids;
        members.push(requester_id);
        conversation.members = members;
      }

      conversation.timestamp = timestamp;
      conversation.conv_type = 'help_feedback';
      conversation.which_user = which_user;

      const nConv = await conversation.save();
      conversation_id = nConv._id;


        // create conversation object on firebase
        await FsConversation.doc(conversation_id.toString()).set({
          _id: conversation_id.toString(),
          timestamp,
          conv_type: 'help_feedback',
          which_user,
          members: nConv.members,
          latest_message_id: '',
          latest_timestamp: 0,
          latest_message_conversation_id: '',
          latest_message_sender_name: '',
          latest_message_sender_id: '',
          latest_message_sender_img: '',
          latest_message_content: '',
          other_username: '',
          other_user_img: 'a',
          other_user_email: '',
          other_user_phone: '',
          unread_msg_count: 1
      });
    }

    // send the message
    const message = new Message;
    message.timestamp = timestamp;
    message.conversation_id = conversation_id;
    message.sender_name = sender_name;
    message.sender_id = user._id;
    message.content = content;
    message.message_type = message_type;
    message.file_name = file_name || '';

    const nMessage = await message.save();

    // update the latest message in converstion object
    const updConvo = await Conversation.findOneAndUpdate({ _id: conversation_id }, {
      $set: {
        latest_message: {
          _id: nMessage._id,
          timestamp,
          conversation_id,
          sender_name,
          sender_id: user._id,
          content,
          sender_img,
          message_type,
          file_name: file_name || ''
        }
      }
    },
      { new: true }
    ).lean();

    // const conversation = updConvo;
    // let other_user_id;
    // conversation.members.map(id => {
    //     if(id != user._id){
    //         other_user_id = id;
    //     }
    // });


    const admin_device_tokens = [];

    if (who_sent == 'user') {
      // const adminsT = await Admin.find({role: 'help_feedback'}).lean();
      // adminsT.map(admin => {
      //     adminT_ids.push(admin._id);
      //     admin_device_tokens.push(admin.device_token);
      // });
      for (let i = 0; i < admin_ids.length; i++) {
        let admins = await Admin.findById({ _id: admin_ids[i] }, { device_token: 1 }).lean();
        console.log(admins);
        console.log(admins.device_token);
        admin_device_tokens.push(admins.device_token);
      }
    }
    console.log(admin_device_tokens);

    // // send notification
    // let notification = new Notification;

    // notification.noti_type = 'msg';
    // notification.content = content;
    // notification.sender_name = sender_name;
    // notification.sender_id = user._id;
    // notification.sender_img_url = sender_img;
    // notification.read = false;
    // notification.receiver_ids = who_sent == 'user' ? admin_ids : [other_user_id];
    // notification.timestamp = timestamp;
    // notification.deleted = false;
    // notification = await notification.save();

    // if (who_sent == 'user') {
    //   // send notification to specific user's device 
    //   const subTitle = `Help & Feedback: ${content}`;
    //   setTimeout(handleNotification, 1000, false, 'requester_id', '', process.env.APP_NAME, subTitle, admin_device_tokens);
    // } else {
    //   // send notification to specific user's device 
    //   const subTitle = `Help & Feedback: ${content}`;
    //   setTimeout(handleNotification, 1000, true, requester_id, '', process.env.APP_NAME, subTitle);
    // }

    return res.status(200).send({ status: 'ok', msg: 'Message sent', message: nMessage });

  } catch (e) {
    console.log(e);
    return res.status(400).json({ status: 'error', msg: e });
  }
});

// endpoint to check if user has started conversation with a seller before
router.post('/check_convers', async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token) {
    return res.status(400).json({ status: 'error', msg: 'All fields must be entered' });
  }

  try {
    // token verification
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // check if previous conversation exists
    const conversation = await Conversation.findOne(
      { conv_type: 'help_feedback', members: user._id }
    ).lean();

    // check if conversation exists
    if (!conversation)
      return res.status(200).send({ status: 'ok', msg: 'No conversation found' });

    return res.status(200).send({ status: 'ok', msg: 'Old conversation', conversation_id: conversation._id });

  } catch (e) {
    console.log(e);
    return res.status(400).json({ status: 'error', msg: e });
  }
});

module.exports = router;