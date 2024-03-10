const express = require('express');
const jwt = require('jsonwebtoken');

const Admin = require('../models/admin');
const AdminIds = require('../models/admin_ids');

const router = express.Router();

router.post('/help_feedback_admin_ids', async (req, res) => {
    const {token} = req.body;

    // check for required fields
    if(!token)
      return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

    try {
        // verify token
        let admin = jwt.verify(token, process.env.JWT_SECRET);

        admin = await Admin.findOne({ _id: admin._id }).select([ '-password' ]).lean();

        // check for admin status
        if(admin.is_deleted == true) {
            return res.status(400).send({ status: 'error', msg: 'Account has been blocked, please contact master admin' });
        }

        // get admin ids
        const admin_ids = await AdminIds.findOne({doc_type: 'admin_ids'}).select(['ids']).lean();

        return res.status(200).send({status: 'ok', msg: 'Success', admin_ids: admin_ids.ids, count: admin_ids.ids.length});

    }catch(e) {
        console.log(e);
        return res.status(403).send({status: 'error', msg: 'some error occurred', e});
    }
});

module.exports = router