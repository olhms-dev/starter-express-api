const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const passwordGenerator = require('generate-password');
const bcrypt = require('bcryptjs');

const upload = require('../utils/multer');
const Student = require('../models/student');
const Guardian = require('../models/guardian');

dotenv.config();
const router = express.Router();

const { sendStudentPasswordReset } = require("../utils/nodemailer");

// endpont to login on mobile app
router.post('/login', upload.single('student-images'), async (req, res) => {
    const { student_id, login_code } = req.body;

    // check for required fields
    if (!student_id || !login_code)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    // check if student account exists
    let student = await Student.findOneAndUpdate({ student_id }, { is_online: true }, { new: true }).lean();
    if (!student)
        return res.status(400).send({ status: 'error', msg: `Student with student ID ${student_id} not found` });

    try {
        if (student.login_code === login_code) {
            // generate token
            const token = jwt.sign({
                _id: student._id,
                email: student.email
            }, process.env.JWT_SECRET);

            delete student.login_code;

            return res.status(200).send({ status: 'ok', msg: 'success', student, token });
        } else {
            return res.status(400).send({ status: 'error', msg: 'incorrect login code' });
        }

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to login on website

router.post('/login_web', async (req, res) => {
    const { student_id, password } = req.body;

    // check for required fields
    if (!student_id || !password)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    // check if student account exists
    let student = await Student.findOne({ student_id }).lean();
    if (!student)
        return res.status(400).send({ status: 'error', msg: `Student with student ID ${student_id} not found` });

    try {

        let student = await Student.findOneAndUpdate({ student_id }, { is_online: true }, { new: true }).lean();
        if (!student)
        return res.status(400).send({ status: 'error', msg: `Student with student ID ${student_id} not found` });

        if(await bcrypt.compare(password, student.password)) {
            // generate token
            const token = jwt.sign({
                _id: student._id,
                student_id: student.student_id
            }, process.env.JWT_SECRET);

            delete student.password;
          
    
            return res.status(200).send({status: 'ok', msg: 'Success', student, token});
        } else {
            return res.status(400).send({status: 'error', msg: 'incorrect password'});
        }

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to change password
router.post('/change_password_web', async (req, res) => {
    const { token, old_password, new_password } = req.body;

    // check for required fields
    if (!token || !old_password || !new_password)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });


    try {
        
        const studToken = jwt.verify(token, process.env.JWT_SECRET);

            // check if student account exists
        let student = await Student.findOne({ _id: studToken._id }).lean();
        if (!student)
            return res.status(400).send({ status: 'error', msg: `Student with student ID ${studToken._id} not found` });
            
        if(await bcrypt.compare(old_password, student.password)) {
            
            const password = await bcrypt.hash(new_password, 10);

            let student = await Student.findOneAndUpdate({ _id: studToken._id }, {password}, { new: true }).lean();
            
            return res.status(200).send({status: 'ok', msg: 'Success', student, token});
        } else {
            return res.status(400).send({status: 'error', msg: 'incorrect password'});
        }

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
        let student = jwt.verify(token, process.env.JWT_SECRET);

        // check if document exists
        student = await Student.findByIdAndUpdate({ _id: student._id }, { $set: { is_online: false, last_logn: Date.now() } }, { new: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', student });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// this endpoint to recover account
router.post("/forgot_password", async (req, res) => {
    const { email, student_id } = req.body;
  
    if (!email || !student_id) {
      return res
        .status(400)
        .send({ status: "error", msg: "All fields must be entered" });
    }
  
    // check if the delivery agent exists
    let student = await Student.findOne({ student_id }, { student_id: 1, children: 1 }).lean();
  
    if (!student) {
      return res.status(400).send({
        status: "error",
        msg: "There is no student account with this student id",
      });
    }

    // check if student id is in guardians document
    const guardian = await Guardian.findOne({email}, {children: 1}).lean();
    // check if guardian exists
    if(!guardian)
      return res.status(400).send({status: "error", msg: "There is no guardian account with this email"});

    const found = guardian.children.some((child) => child.student_id === student_id);
    if(!found)
    return res.status(400).send({
        status: "error",
        msg: "The student is not a child of the guardian with email provided",
    });
  
    // create resetPasswordCode
    /**
     * Get the current timestamp and use to verify whether the
     * delivery agent can still use this link to reset their password
     */
  
    const timestamp = Date.now();
    const resetPasswordCode = jwt.sign(
      { email, timestamp, student_id },
      process.env.JWT_SECRET
    );
  
    //send email to Delivery_agent to reset password
    sendStudentPasswordReset(email, resetPasswordCode);
  
    return res.status(200).json({
      status: "ok",
      msg: "Password reset email sent, please check your email",
    });
});
  
// endpoint to recover account webpage
router.get("/reset_password_page/:resetPasswordCode", async (req, res) => {
    const resetPasswordCode = req.params.resetPasswordCode;
    try {
      const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);
  
      const sendTime = data.timestamp;
      // check if more than 10 minutes has elapsed
      // Calculate the timestamp for 10 minutes later (600,000 milliseconds)
      const timeLimit = sendTime + 600000;
      const timestamp = Date.now();
      if (timestamp > timeLimit) {
        // console.log('handle the expiration of the request code');
        return res.status(200).send(`</div>
        <h1>Password Reset</h1>
        <p>Token Expired</p>
        <p>Time limit exceeded for password recovery</p>
        </div>`);
      }
  
      return res.send(`<!DOCTYPE html>
        <html>
            <head>
                <title>Recover Account</title>
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
                @media screen and (max-width: 900px) {
                    form{
                width: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                    }
                
    
                }
                    input[type=text]
                {
                        width: 100%;
                        padding: 12px 20px;
                        margin: 8px 0;
                        display: inline-block;
                        border: 1px solid #ccc;
                        box-sizing: border-box;
                    }
    
                    button {
                        background-color: #04AA6D;
                        color: white;
                        padding: 14px 20px;
                        margin: 8px 0;
                        border: none;
                        cursor: pointer;
                        width: 100%;
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
    
                    /* Change styles for span and cancel button on extra small screens */
                    @media screen and (max-width: 300px) {
                        span.psw {
                            display: block;
                            float: none;
                        }
    
                        .cancelbtn {
                            width: 100%;
                        }
                    }
                </style>
            </head>
            <body>    
                    <h2 style="display: flex; align-items: center; justify-content: center; margin-bottom: 0;">Reset Password</h2>
                    <h6 style="display: flex; align-items: center; justify-content: center; font-weight: 400;">Enter the new password
                        you want to use in your account</h6>    
            
                <form action="https://server-olhms.onrender.com/student_auth/reset_password" method="post">
                    <div class="imgcontainer">
                    </div>
                    <div class="container">
                        <input type="text" placeholder="Enter password" name="password" required style="border-radius: 5px;" minlength="5">
                        <input type='text' placeholder="nil" name='resetPasswordCode' value=${resetPasswordCode} style="visibility: hidden"><br>
                        <button type="submit" style="border-radius: 5px; background-color: #e05616;">Submit</button>            
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
  
// endpoint to reset password
router.post("/reset_password", async (req, res) => {
    const { password, resetPasswordCode } = req.body;
  
    if (!password || !resetPasswordCode) {
      return res
        .status(400)
        .json({ status: "error", msg: "All fields must be entered" });
    }
  
    try {
      const data = jwt.verify(resetPasswordCode, process.env.JWT_SECRET);
  
      const nPassword = await bcrypt.hash(password, 10);
  
      
        await Guardian.updateOne(
          { email: data.email },
          {
            $set: { password: nPassword },
          }
        );
      
  
      // return a response which is a web page
      return res.status(200).send(`</div>
        <h1>Recover Account</h1>
        <p>Your password has been changed successfully!!!</p>
        <p>You can now login with your new password.</p>
        </div>`);
    } catch (e) {
      return res.status(200).send(`</div>
        <h1>Recover Account</h1>
        <p>An error occured!!! ${e.toString()}</p>
        </div>`);
    }
});

module.exports = router;