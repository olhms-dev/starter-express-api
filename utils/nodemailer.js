const { process_params } = require('express/lib/router');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();


const transport = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false,
    // requireTLS: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const sendConfirmationEmail = (fullname, email, confirmationCode) => {
    console.log(process.env.MAIL_PASS);
    transport.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Please confirm your account',
        html: `<h1>Email Confirmation<h2>
        <p>Thank you ${fullname} for signing up with our App Service. Please confirm your email by clicking on the following link</p>
        <a href=https://server-olhms.onrender.com/${confirmationCode}> Click here</a>
        <p>Cheers</p>
        <p>Your App Service team</p>
        </div>`,
        // text: 'Testing email'
    }).catch(err => console.log(err));
}

const sendLoginDetails = (fullname, login_details) => {
    console.log(process.env.MAIL_PASS);
    transport.sendMail({
        from: process.env.MAIL_USER,
        to: login_details.email,
        subject: 'Login Details',
        html: `<h1>Email Confirmation<h2>
        <p>Thank you ${fullname} for registering with Deebug Institute.</p>
        <p>Login Details: Email: ${login_details.email} <br /> Password: ${login_details.password} </p>
        <p>Goodluck with your learning journey</p>
        </div>`
    }).catch(err => console.log(err));
}

const sendHelpSupport = (email, subject, message) => {
    console.log(process.env.MAIL_PASS);
    transport.sendMail({
        from: email,
        to: process.env.MAIL_USER,
        subject: 'Help and Support',
        html: `<h1>${subject}t<h2>
        <p>${message}</p>
        </div>`
    }).catch(err => console.log(err));
}

const sendPasswordReset = (email, resetPasswordCode) => {
    transport.sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Password Reset',
        html: `<h1>Password Reset</h1>
        <p>Hi!</p>
        <p>We received a request to reset your password. To proceed with the password reset, please click the link below:</p>
        <a href=https://server-olhms.onrender.com/admin_auth/reset_password_page/${resetPasswordCode}>Reset Your Password</a>
        <p>If you did not request a password reset, please disregard this email.</p>
        <p>Note: This link will expire after 10mins</p>
        <p>Thank you for using our service!</p><br />
        </div>`
    })
    .then(res => console.log('email sent successfully'))
    .catch(err => console.log(err));
}

const sendStudentPasswordReset = (email, resetPasswordCode) => {
  transport.sendMail({
      from: `OLHMS <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset',
      html: `<h1>Password Reset</h1>
      <p>Hi!</p>
      <p>We received a request to reset your password. To proceed with the password reset, please click the link below:</p>
      <a href=https://server-olhms.onrender.com/student_auth/reset_password_page/${resetPasswordCode}>Reset Your Password</a>
      <p>If you did not request a password reset, please disregard this email.</p>
      <p>Note: This link will expire after 10mins</p>
      <p>Thank you for using our service!</p><br />
      </div>`
  })
  .then(res => console.log('email sent successfully'))
  .catch(err => console.log(err));
}

const sendDeleteAccount = (email, deleteAccountCode) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Delete Guardian Account for OLHMS",
        html: `<p style="line-height: 1.5">
        Hello! <br/>
        Thank you for reaching out to us with your request to delete your account on our platform.
        We're sorry to see you go, but we understand that circumstances change. <br /> <br />
        As requested, we have initiated the process to delete your account. Please note that once your account is deleted, you will lose all your data and you will not be able to retrieve any information associated with it, including your login credentials. <br />
        If you're ready to delete your account, click the link.
        <a href=https://server-olhms.onrender.com/guardian_auth/delete_account_page/${deleteAccountCode}>Proceed to delete account</a> <br /> <br />
        Otherwise, you can ignore this mail and your account will remain active.<br />
        We hope you had a positive experience with us; if you change your mind and wish to use our app again in the future, you'll need to create a new account.<br />
        Thank you for your understanding and we hope to see you again soon! <br /> <br />
        Best regards,<br />
        Team OLHMS.
    </p>
          </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

const sendScheduleDateTime = (dateTime, student_details, rescheduled) => {
    console.log(process.env.MAIL_PASS);
    transport.sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: student_details.email,
        subject: rescheduled == true ? 'OLHMS Interview Reschedule' : 'OLHMS Interview Schedule',
        html: rescheduled == true ? `<div><p>Thank you ${student_details.fullname} for applying for OLHMS</p>
        <p>This email is to inform you that your interview has been rescheuduled for ${dateTime.interview_date} ${dateTime.interview_time}<br /> </p>
        <p>Please do well to be punctual </ p> </ br>
        <p>Goodluck</p>
        </div>` : `<div><p>Thank you ${student_details.fullname} for applying for OLHMS</p>
        <p>This email is to inform you of when you are slated to come for your registration which is on the ${dateTime.interview_date} ${dateTime.interview_time}<br /> </p>
        <p>Please do well to be punctual </ p> </ br>
        <p>Goodluck</p>
        </div>`
    }).catch(err => console.log(err));
}

const replyGetInTouch = (email, message) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Thank you for your enquiry",
        html: `<p style="line-height: 1.5">
            ${message}
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };


  const newStoreItemRequest = (email, student_name, student_id) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Store Request Approval",
        html: `<p style="line-height: 1.5">
            New store request from student: ${student_name} with student_id: ${student_id}
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

  const notifyStoreItemRequestPending = (email, student_name) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Store Request Approval",
        html: `<p style="line-height: 1.5">
            Hi ${student_name},<br/>
            Your requested items are ready for payment and pickup.
            <br/>
            Thanks
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

  const notifyStoreItemRequestCollected = (email, student_name) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Store Request Approval",
        html: `<p style="line-height: 1.5">
            Hi ${student_name},<br/>
            Thank you for your purchase.
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

  const sendLoginDetailsMail = (student_name, email, student_id, password) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Login Details",
        html: `<p style="line-height: 1.5">
            Hi ${student_name},<br/>
            Congratulations on your successful admission into Our Lady Of Hope Montessori School, below are the login details to your personal portal. <br/><br/>
            Email: ${email}<br/>
            Student Id: ${student_id}<br/>
            Password: ${password}
            <br/>
            Thanks
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

  const sendLoginCodeMail = (student_name, email, loginCode, term, session) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Login Code",
        html: `<p style="line-height: 1.5">
            Hi ${student_name},<br/>
            You school fees payment has been confirmed for ${term} of ${session}, below are your login details for the mobile app. <br/><br/>
            Login Code: ${loginCode}<br/>
            <br/>
            Thanks
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

  const sendMailsToEmailSubscribers = (emails, title) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: emails,
        subject: "OLHMS Newsletter",
        html: `<p style="line-height: 1.5">
            Hi there, check out our news post on our website<br/>
            ${title}
            <br/>
            Thanks
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };


  const emailStaff = (email, message, staff_name) => {
    transport
      .sendMail({
        from: `OLHMS <${process.env.MAIL_USER}>`,
        to: email,
        subject: `Hello ${staff_name}`,
        html: `<p style="line-height: 1.5">
            ${message}
        </p>
        </div>`,
      })
      .then((res) => console.log("email sent successfully"))
      .catch((err) => console.log(err));
  };

module.exports = {
    sendConfirmationEmail,
    sendPasswordReset,
    sendStudentPasswordReset,
    sendLoginDetails,
    sendHelpSupport,
    sendDeleteAccount,
    sendScheduleDateTime,
    replyGetInTouch,
    newStoreItemRequest,
    notifyStoreItemRequestPending,
    notifyStoreItemRequestCollected,
    sendLoginDetailsMail,
    sendLoginCodeMail,
    sendMailsToEmailSubscribers,
    emailStaff
};