const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const Payment = require("../models/payment");
const Student = require("../models/student");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");

const { sendLoginCodeMail } = require("../utils/nodemailer");

dotenv.config();
const router = express.Router();

// endpoint to make a payment
router.post("/make_payment", async (req, res) => {
  const {
    token,
    term,
    description,
    admin_name,
    verdict,
    student_name,
    student_id,
    payment_type,
    addmission_year,
    payment_date,
    item_description,
    amount,
    session,
    amount_in_words,
  } = req.body;

  // check for required fields
  if (
    !token ||
    !student_name ||
    !amount ||
    !student_id ||
    !payment_type ||
    !payment_date ||
    !session ||
    !term ||
    !amount_in_words
  )
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // // upload profile picture
    let img_url = "";
    let img_id = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "product-images",
      });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    // create a new product document and populate it
    let payment = new Payment();
    payment.student_name = student_name || "";
    payment.amount = amount || "";
    payment.session = session || "";
    payment.term = term || "";
    payment.description = description || "";
    payment.admin_name = admin_name || "";
    payment.verdict = verdict || "";
    payment.payment_date = payment_date || "";
    payment.item_description = item_description || "";
    payment.addmission_year = addmission_year || "";
    payment.payment_type = payment_type || "";
    payment.student_id = student_id || "";
    payment.img_id = img_id || "";
    payment.img_url = img_url || "";
    payment.timestamp = Date.now();
    payment.amount_in_words = amount_in_words;

    payment = await payment.save();

    // create login code based on payment type
    let login_code = "";
    if (payment_type === "School Fees") {
      // Check if the name contains a whitespace
      const hasWhitespace = student_name.includes(" ");

      // Extract the first letter from the first name and last name
      let firstLetterFirstName, firstLetterLastName;

      if (hasWhitespace) {
        [firstLetterFirstName, firstLetterLastName] = student_name
          .split(" ")
          .map((name) => name.charAt(0).toUpperCase());
      } else {
        // If there's no whitespace, use the first letter for the entire name
        firstLetterFirstName = student_name.charAt(0).toUpperCase();
        firstLetterLastName = ""; // Assuming an empty string for last name
      }

      // Generate a random 4-digit number
      const randomFourDigitNumber = Math.floor(1000 + Math.random() * 9000);

      // Concatenate the letters and the random number
      const uniqueIdentifier =
        firstLetterFirstName + firstLetterLastName + randomFourDigitNumber;

      login_code = uniqueIdentifier;
      // login_code = Date.now();
      await Student.updateOne({ student_id }, { login_code }).lean();
      await Payment.updateOne({ _id: payment._id }, { login_code });
    }

    return res
      .status(200)
      .send({ status: "ok", msg: "success", login_code, payment });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to deactivate a student's login code
router.post("/deactivate_login_code", async (req, res) => {
  const { token, student_id } = req.body;

  // check for required fields
  if (!token || !student_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    await Student.updateOne({ student_id }, { login_code: "not set" }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to edit product
router.post("/edit_product", upload.single("profile-pic"), async (req, res) => {
  const {
    token,
    term,
    description,
    admin_name,
    verdict,
    student_id,
    payment_type,
    addmission_year,
    payment_date,
    item_description,
    student_name,
    amount,
    session,
    payment_id,
  } = req.body;

  // check for required fields
  if (!token || !payment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch product document
    let product = await Payment.findById({ _id: payment_id }).lean();

    // // upload profile picture
    let img_url = "";
    let img_id = "";
    if (req.file) {
      if (product.img_id != "") {
        await cloudinary.uploader.destroy(product.img_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "product-profile-pictures",
      });
      console.log(result);
      img_url = result.secure_url;
      img_id = result.public_id;
    }

    product = await Payment.findByIdAndUpdate(
      { _id: payment_id },
      {
        student_name: student_name || product.student_name,
        term: term || product.term,
        description: description || product.description,
        admin_name: admin_name || product.admin_name,
        verdict: verdict || product.verdict,
        amount: amount || product.amount,
        payment_date: payment_date || product.payment_date,
        item_description: item_description || product.item_description,
        addmission_year: addmission_year || product.addmission_year,
        payment_type: payment_type || product.payment_type,
        student_id: student_id || product.student_id,
        session: session || product.session,
        img_url: img_url || product.img_url,
        img_id: img_id || product.img_id,
      },
      { new: true }
    ).lean();

    return res.status(200).send({ status: "ok", msg: "Success", product });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view payment
router.post("/view_product", async (req, res) => {
  const { token, payment_id } = req.body;

  // check for required fields
  if (!token || !payment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch product document
    const payment = await Payment.findById({ _id: payment_id }).lean();

    return res.status(200).send({ status: "ok", msg: "success", payment });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view payments
router.post("/view_payments", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch payment document
    const payments = await Payment.find(
      { is_deleted: false },
      { is_deleted: 0, timestamp: 0, img_id: 0 }
    ).lean();

    // check if payments exist
    if (payments.length === 0)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: "no payments at the moment",
          count: 0,
          payments: [],
        });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", payments, count: payments.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view student payments
router.post("/view_student_payments", async (req, res) => {
  const { token, student_id } = req.body;

  // check for required fields
  if (!token || !student_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch payment document
    const payments = await Payment.find({ student_id: student_id }).lean();

    // check if payments exist
    if (payments.length === 0)
      return res
        .status(200)
        .send({
          status: "ok",
          msg: "no payments at the moment",
          count: 0,
          payments: [],
        });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", payments, count: payments.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to delete payment
router.post("/delete_product", async (req, res) => {
  const { token, payment_id } = req.body;

  // check for required fields
  if (!token || !payment_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    // fetch payment document
    await Payment.updateOne({ _id: payment_id }, { is_deleted: true }).lean();

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to send login code to student
router.post("/send_login_code_mail", async (req, res) => {
  const { token, student_name, email, term, login_code, session } = req.body;

  // check for required fields
  if (!token || !student_name || !email || !login_code || !term || !session)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // send mail to applicant
    sendLoginCodeMail(student_name, email, login_code, term, session);

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

module.exports = router;
