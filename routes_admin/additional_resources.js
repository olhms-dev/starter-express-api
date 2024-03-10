const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const AdditionalResources = require('../models/additional_resources');

dotenv.config();
const router = express.Router();

// create additional_resources
router.post('/create_additional_resources', upload.array('additional_resourcess'), async (req, res) => {
    const { token, lesson_no, lesson_type, description, title, class_name, subject_name, week } = req.body;

    // check for required fields
    if (!token || !week || !lesson_no || !lesson_type || !description || !class_name || !subject_name || !title || req.files == null || req.files == undefined)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile file
        let video_url = '';
        let video_id = '';
        let pdf_url = '';
        let pdf_id = '';
        let img_url = '';
        let img_id = '';
        for (let i = 0; i < req.files.length; i++) {
            const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'additional resourcess' });
            let ext = path.extname(req.files[i].originalname);
            console.log(ext);
            if (ext == '.pdf') {
                const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'additional resourcess' });
                pdf_url = result.secure_url;
                pdf_id = result.public_id;
            }
            
            if(ext == '.mkv' || ext == '.mp4'){
                const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'additional resourcess', resource_type: "video", chunk_size: 6000000});
                video_url = result.secure_url;
                video_id = result.public_id;
            }

            if(ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') {
                const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'additional resourcess'});
                img_url = result.secure_url;
                img_id = result.public_id;
              }
        }

        // create a new additional_resources document and populate it
        let additional_resources = new AdditionalResources;
        additional_resources.title = title;
        additional_resources.week = week;
        additional_resources.class_name = class_name;
        additional_resources.subject_name = subject_name;
        additional_resources.lesson_no = lesson_no;
        additional_resources.lesson_type = lesson_type;
        additional_resources.description = description;
        additional_resources.video_url = video_url || '';
        additional_resources.video_id = video_id || '';
        additional_resources.pdf_url = pdf_url || '';
        additional_resources.pdf_id = pdf_id || '';
        additional_resources.img_url = img_url || '';
        additional_resources.img_id = img_id || '';
        additional_resources.timestamp = Date.now();

        await additional_resources.save();

        return res.status(200).send({ status: 'ok', msg: 'success', additional_resources });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to edit additional_resources
router.post('/edit_additional_resources', upload.array('additional_resourcess'), async (req, res) => {
    const { token, title, week, class_name, subject_name, additional_resources_id } = req.body;

    // check for required fields
    if (!token || !additional_resources_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile files        
        let additional_resources = await AdditionalResources.findById({ _id: additional_resources_id }).lean();
        let pdf_url = '';
        let pdf_id = '';
        let img_url = '';
        let img_id = '';
        for (let i = 0; i < req.files.length; i++) {
            let extname = path.extname(req.files[i].originalname);
            if (extname == '.pdf') {
                if (additional_resources.pdf_id != '') {
                    await cloudinary.uploader.destroy(additional_resources.pdf_id);
                }
            } else {
                if (additional_resources.img_id != '') {
                    await cloudinary.uploader.destroy(additional_resources.img_id);
                }
            }
            const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'additional_resourcess' });
            let ext = path.extname(req.files[i].originalname);
            if (ext == '.pdf') {
                pdf_url = result.secure_url;
                pdf_id = result.public_id;
            } else {
                img_url = result.secure_url;
                img_id = result.public_id;
            }
        }

        // fetch and update document
        additional_resources = await AdditionalResources.findByIdAndUpdate(
            { _id: additional_resources_id },
            {
                title: title || additional_resources.title,
                week: week || additional_resources.week,
                subject_name: subject_name || additional_resources.subject_name,
                class_name: class_name || additional_resources.class_name,
                pdf_url: pdf_url || additional_resources.pdf_url,
                pdf_id: pdf_id || additional_resources.pdf_id,
                img_url: img_url || additional_resources.img_url,
                img_id: img_id || additional_resources.img_id
            },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', additional_resources });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view single additional_resources
router.post('/view_single_additional_resources', async (req, res) => {
    const { token, additional_resources_id } = req.body;

    // check for required fields
    if (!token || !additional_resources_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch additional_resources document
        const additional_resources = await AdditionalResources.findById({ _id: additional_resources_id }).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', additional_resources });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view multiple additional_resourcess
router.post('/view_multiple_additional_resources', async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch additional_resources document
        const additional_resources = await AdditionalResources.find({ is_deleted: false }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

        // check if additional_resourcess exist
        if (additional_resources.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no additional_resourcess at the moment', count: 0 });

        return res.status(200).send({ status: 'ok', msg: 'success', additional_resources, count: additional_resources.length });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view multiple additional_resourcess based on week
router.post('/view_multiple_additional_resources', async (req, res) => {
    const { token, week, subject_name, class_name } = req.body;

    // check for required fields
    if (!token || !week || !subject_name || !class_name)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch additional_resources document
        const additional_resources = await AdditionalResources.find({ is_deleted: false, week, subject_name, class_name }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

        // check if additional_resourcess exist
        if (additional_resources.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no additional_resourcess at the moment', count: 0 });

        return res.status(200).send({ status: 'ok', msg: 'success', additional_resources, count: additional_resources.length });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to delete additional_resources
router.post('/delete_additional_resources', async (req, res) => {
    const { token, additional_resources_id } = req.body;

    // check for required fields
    if (!token || !additional_resources_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch additional_resources document
        await AdditionalResources.updateOne({ _id: additional_resources_id }, { is_deleted: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success' });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

module.exports = router;