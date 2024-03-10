const express = require('express');
const dotenv = require('dotenv');

const PaymentCode = require('../models/payment_code');

dotenv.config();
const router = express.Router();

// endpoint to submit continuous assessment
router.post('/generate_payment_code', async (req, res) => {
  try {
    // create payemt string document
    const timestamp = Date.now();
    let payment_code = new PaymentCode;
    payment_code.payment_code = timestamp;
    await payment_code.save();

    return res.status(200).send({status: 'ok', msg: 'success', payment_code: timestamp});
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// endpoint to check for payment code validity
router.post('/check_payment_code_validity', async (req, res) => {
  const {payment_code} = req.body;

  // check for required fields
  if(!payment_code)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try {
    // fetch payment code document
    const payment_codeM = await PaymentCode.findOne({payment_code}).lean();

    // check if payment code is correct
    if(!payment_codeM)
      return res.status(400).send({status: 'error', msg: 'incorrect payment code'});

    return res.status(200).send({status: 'ok', msg: 'success'});
    
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

module.exports = router;