const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passwordGenerator = require('generate-password');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Guardian = require('../models/guardian');
const Student = require('../models/student');

const {
  FsGuardian,
  FieldValue,
} = require("../services/firebase_service_config");

const {sendDeleteAccount} = require("../utils/nodemailer");

dotenv.config();
const router = express.Router();

/* 
    children variable format
    children: [{
        student_id: String,
        avatar_url: String,
        login_code: String
    }]
*/
// create guardian
router.post('/auth', upload.single('guardian-images'), async (req, res) => {
    const { fullname, email, phone_no, children } = req.body;

    // check for required fields
    if (!fullname || !email || !phone_no)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // check if guardian account exists
        let guardian = await Guardian.findOne({ email, phone_no, is_deleted: false}, { phone_no: 1 }).lean();
        if (guardian)
            return res.status(400).send({ status: 'error', msg: `guaradian with email: ${email} or phone_no: ${phone_no} already exists` })

        // create a new guardian document
        guardian = new Guardian;

        // check if children exists and update their documents
        if (children) {
            for (let i = 0; i < children.length; i++) {
                let childrenM = await Student.findOne(
                    { student_id: children[i].student_id }
                ).lean();
                if (!childrenM)
                    return res.status(400).send({ status: 'error', msg: `student with the student id ${children[i].student_id} not found` });
                
                // check for login code validity
                childrenM = await Student.findOneAndUpdate(
                    {student_id: children[i].student_id, login_code: children[i].login_code},
                    {
                        'guardian_info.guardian_id': guardian._id
                    },
                    { new: true }
                ).lean();
                if (!childrenM)
                    return res.status(400).send({ status: 'error', msg: `login code for student with student id ${children[i].student_id} incorrect` });
                children[i].fullname = childrenM.fullname;
                children[i].class_name = childrenM.class_name;                
            }
        }

        // populate guardian document
        guardian.fullname = fullname;
        guardian.email = email;
        guardian.phone_no = phone_no;
        guardian.children = children;
        guardian.last_login = 0;
        guardian.timestamp = Date.now();

        guardian = await guardian.save();

        await FsGuardian.doc(guardian._id.toString()).set({
          _id: guardian._id.toString(),
          token: "",
          channel_name: "",
          fullname: fullname,
          img_url: 'a',
          designation: "user",
          is_deleted: false,
          is_blocked: false
        });

        return res.status(200).send({ status: 'ok', msg: 'Success', guardian });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

/* 
    children variable format
    children: [{
        student_id: String,
        avatar_url: String,
        login_code: String
    }]
*/
// endpoint to add another child
router.post('/add_child',  async (req, res) => {
    const { token, children } = req.body;

    // check for required fields
    if (!token || !children)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {

        // verify token
        let guardian = jwt.verify(token, process.env.JWT_SECRET);

        // check if children exists and update their documents
        for (let i = 0; i < children.length; i++) {
            let childrenM = await Student.findOne(
                { student_id: children[i].student_id }
            ).lean();
            if (!childrenM)
                return res.status(400).send({ status: 'error', msg: `student with the student id ${children[i].student_id} not found` });
            
            // check for login code validity
            childrenM = await Student.findOneAndUpdate(
                {student_id: children[i].student_id, login_code: children[i].login_code},
                {
                    'guardian_info.guardian_id': guardian._id
                },
                { new: true }
            ).lean();
            if (!childrenM)
                return res.status(400).send({ status: 'error', msg: `login code for student with student id ${children[i].student_id} incorrect` });
            children[i].fullname = childrenM.fullname;
            children[i].class_name = childrenM.class_name;                
        }

        // update guardian document
        for (let i = 0; i < children.length; i++) {
            guardian = await Guardian.findByIdAndUpdate({ _id: guardian._id }, { $push: { children: children[i] } }, { new: true }).lean();
        }

        return res.status(200).send({ status: 'ok', msg: 'Success', guardian });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to login
router.post('/login', upload.single('guardian-images'), async (req, res) => {
    const { phone_no, email } = req.body;

    // check for required fields
    if (!email || !phone_no)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // check if document exists
        const guardian = await Guardian.findOneAndUpdate({ email, phone_no }, { is_online: true }, { new: true }).lean();
        if (!guardian)
            return res.status(400).send({ status: 'error', msg: 'account not found' });

        // generate token
        const token = jwt.sign({
            _id: guardian._id,
            email: guardian.email
        }, process.env.JWT_SECRET);

        return res.status(200).send({ status: 'ok', msg: 'Success', guardian, token });            

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to logout
router.post('/logout', async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        let guardian = jwt.verify(token, process.env.JWT_SECRET);

        // check if document exists
        guardian = await Guardian.findByIdAndUpdate({ _id: guardian._id }, { $set: { is_online: false, last_logn: Date.now() } }, { new: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', guardian });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

/* student_details field is a list of maps in format
    [{
    student_id: "lorem ipsuim",
    login_code: "yada yada"
    }]
*/ 
// endpoint to check for login code validity during add child event
router.post('/check_login_code', async (req, res) => {
    const { token, student_details } = req.body;

    // check for required fields
    if (!token || !student_details)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // token verification
        jwt.verify(token, process.env.JWT_SECRET);
        
        // check if children exists and update their documents
        for (let i = 0; i < student_details.length; i++) {
            let childrenM = await Student.findOne(
                { student_id: student_details[i].student_id }
            ).lean();

            if (!childrenM)
                return res.status(400).send({ status: 'error', msg: `student with the student id ${student_details[i].student_id} not found` });
            
            // check for login code validity
            childrenM = await Student.findOne(
                {student_id: student_details[i].student_id, login_code: student_details[i].login_code}
            ).lean();
            
            if (!childrenM)
                return res.status(400).send({ status: 'error', msg: `login code for student with student id ${student_details[i].student_id} incorrect` });
              
            // if (childrenM.login_code_expired === true)
            //   return res.status(400).send({ status: 'error', msg: `login code has expired` });
        }

        return res.status(200).send({ status: 'ok', msg: 'Success' })
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// // endpoint to edit guardian
// router.post('/edit_guardian', upload.single('guardian-images'), async (req, res) => {
//     const {token, phone_no, email, children, fullname, guardian_id} = req.body;

//     // check for required fields
//     if(!token || !guardian_id)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         // const Admin = jwt.verify(token, process.env.JWT_SECRET);
//         // // upload profile picture        
//         // let guardian = await guardian.findById({_id: guardian_id}).lean();
//         // let img_url = '';
//         // let img_id = '';
//         // if(req.file) {   
//         //     if(guardian.img_id != '') {
//         //       await cloudinary.uploader.destroy(guardian.img_id);    
//         //     }    
//         //     const result = await cloudinary.uploader.upload(req.file.path, {folder: 'guardian-images'});
//         //     console.log(result);
//         //     img_url = result.secure_url;
//         //     img_id = result.public_id;
//         // }

//         // fetch and update document
//         guardian = await Guardian.findByIdAndUpdate(
//             {_id: guardian_id},
//             {
//                 children: children || guardian.children,
//                 fullname: fullname || guardian.fullname,
//                 email: email || guardian.email,
//                 phone_no: phone_no || guardian.phone_no
//             },
//             {new: true}
//         ).lean();

//         return res.status(200).send({status: 'ok', msg: 'Success', guardian});

//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// // endpoint to view guardian
// router.post('/view_guardian', async (req, res) => {
//     const {token, guardian_id} = req.body;

//     // check for required fields
//     if(!token || !guardian_id)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         // const Admin = jwt.verify(token, process.env.JWT_SECRET);

//         // fetch guardian document
//         const guardian = await Guardian.findById({_id: guardian_id}).lean();

//         return res.status(200).send({status: 'ok', msg: 'Success', guardian});

//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// // endpoint to view guardians
// router.post('/view_guardians', async (req, res) => {
//     const {token} = req.body;

//     // check for required fields
//     if(!token)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         // const Admin = jwt.verify(token, process.env.JWT_SECRET);

//         // fetch guardian document
//         const guardians = await Guardian.find({is_deleted: false}, {is_deleted: 0, timestamp: 0, img_id: 0}).lean();

//         // check if guardians exist
//         if(guardians.length === 0)
//           return res.status(200).send({status: 'ok', msg: 'no guardians at the moment', count: 0});

//         return res.status(200).send({status: 'ok', msg: 'success', guardians, count: guardians.length});


//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// // endpoint to delete guardian
// router.post('/delete_guardian', async (req, res) => {
//     const {token, guardian_id} = req.body;

//     // check for required fields
//     if(!token || !guardian_id)
//       return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//     try{
//         // verify token
//         // const Admin = jwt.verify(token, process.env.JWT_SECRET);

//         // fetch guardian document
//         await Guardian.updateOne({_id: guardian_id}, {is_deleted: true}).lean();

//         return res.status(200).send({status: 'ok', msg: 'success'});


//     } catch(e) {
//         console.log(e);
//         return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//     }
// });

// endpoint to request delete guardian account
router.post("/request_delete_account", async (req, res) => {
    const { email, phone } = req.body;
  
    if (!email || !phone)
      return res
        .status(400)
        .json({ status: "error", msg: "All fields must be entered" });
  
    try {
      // jwt.verify(token, process.env.JWT_SECRET);
  
      // generate code
      const deleteAccountCode = jwt.sign(
        {
          timestamp: Date.now(),
          email,
          phone,
        },
        process.env.JWT_SECRET
      );
  
      // send mail to the user
      sendDeleteAccount(email, deleteAccountCode);
  
      // return a response which is a web page
      return res.status(200).send({ status: "ok", msg: "success" });
    } catch (e) {
      console.log("error", e);
      return res
        .status(503)
        .send({ status: "error", msg: "some error occurred" });
    }
  });
  
  // endpoint to delete account page
  router.get("/delete_account_page/:deleteAccountCode", async (req, res) => {
    const deleteAccountCode = req.params.deleteAccountCode;
    try {
      const data = jwt.verify(deleteAccountCode, process.env.JWT_SECRET);
  
      // const sendTime = data.timestamp;
      // // check if more than 5 minutes has elapsed
      // const timestamp = Date.now();
      // if(timestamp > sendTime){
      //     console.log('handle the expiration of the request code');
      // }
  
      return res.send(`<!DOCTYPE html>
          <html>
            <head>
              <title>Delete Account</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: Arial, Helvetica, sans-serif;
                  margin-top: 10%;
                }
                form{
                  width: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-left: 26%;
                  margin-top: 0%;
                }
                  input[type=text] {
                    width: 100%;
                    padding: 12px 20px;
                    margin: 8px 0;
                    display: inline-block;
                    border: 1px solid #ccc;
                    box-sizing: border-box;
                  }
                  button:hover {
                    opacity: 0.8;
                  }
                  .container {
                    padding: 16px;
                  }
                  span.psw {
                    float: right;
                    padding-top: 16px;
                  }
              </style>
            </head>
            <body>
            <h3 style="display: flex; align-items: center; justify-content: center; margin-bottom: 0;">Delete Account</h2>
              <h6 style="display: flex; text-align: center; align-items: center; justify-content: center; font-weight: 200;">Are you sure you want to delete your Pickload account?</h6>
              <form action="https://polar-spire-56590.herokuapp.com/guardian_auth/delete_account" method="post">
                
                <div class="container">
                  <input type='text' placeholder= "nil" name='deleteAccountCode' value=${deleteAccountCode} style="visibility: hidden"><br>
                  <button type="submit" style="border-radius: 5px; padding: 14px 20px; background-color: #1aa803; color: white">Yes, Delete Account</button>
                </div>
              </form>
            </body>
          </html>`);
    } catch (e) {
      console.log(e);
      return res.status(200).send(`</div>
          <h1>Password Reset</h1>
          <p>An error occured!!! ${e}</p>
          </div>`);
    }
  });
  
  // endpoint to delete account
  router.post("/delete_account", async (req, res) => {
    const { deleteAccountCode } = req.body;
  
    if (!deleteAccountCode) {
      return res
        .status(400)
        .json({ status: "error", msg: "All fields must be entered" });
    }
  
    try {
      const user = jwt.verify(deleteAccountCode, process.env.JWT_SECRET);
  
      // check if phone number is already in use
      // await Guardian.deleteOne({email: user.email, is_deleted: false}).lean();
      await Guardian.updateOne(
        { email: user.email, is_deleted: false },
        { phone_no: `${user.phone}_deleted_${Date.now()}`, is_deleted: true },
        { upsert: true }
      ).lean();

      // update student account(s) deleted field under guardian
      await Student.updateMany(
        {'guardian_info.guardian_id': user._id},
        {is_deleted: true}
      ).lean();
  
      console.log("------------> DELETED MY GUY");
  
      // update statistics document
      await Statistics.updateOne(
        { doc_type: "admin" },
        {$inc: {no_of_students: -1}},
        { upsert: true }
      ).lean();
  
      // return a response which is a web page
      return res.status(200).send(`</div>
          <p>Your account has been deleted successfully!!!</p>
          </div>`);
    } catch (e) {
      console.log("error", e);
      return res.status(200).send(`</div>
          <h1>Delete Account</h1>
          <p>An error occured!!! ${e}</p>
          </div>`);
    }
  });

module.exports = router;