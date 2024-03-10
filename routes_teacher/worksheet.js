const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Worksheet = require('../models/worksheet');

dotenv.config();
const router = express.Router();

// endpoint to create continous assessment
router.post('/create_worksheet', upload.single('worksheet-images'), async (req, res) => {
    const { token, week, subject_name, category, topic, session, term, class_name, question, question_type, correct_answer, img_ids, img_urls, options, answer_type, mark } = req.body;
    console.log(req.body);
    // check for required fields
    if (!token || !week || !subject_name || !category || !topic || !session || !term || !class_name || !question || !question_type || !correct_answer || !img_ids || !img_urls || !options || !answer_type || !mark)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });


    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);
        // // upload profile picture
        // let img_url = '';
        // let img_id = '';
        // if (req.file) {
        //     const result = await cloudinary.uploader.upload(req.file.path, { folder: 'worksheet-images' });
        //     console.log(result);
        //     img_url = result.secure_url;
        //     img_id = result.public_id;
        // }

        // create a new worksheet document and populate it
        let worksheet = new Worksheet;
        worksheet.topic = topic;
        worksheet.session = session;
        worksheet.week = week;
        worksheet.question = question;
        worksheet.question_type = question_type;
        worksheet.correct_answer = correct_answer;
        worksheet.options = options;
        worksheet.answer_type = answer_type;
        worksheet.mark = mark;
        worksheet.subject_name = subject_name;
        worksheet.category = category;
        worksheet.term = term;
        worksheet.class_name = class_name;
        worksheet.img_ids = img_ids;
        worksheet.img_urls = img_urls;
        worksheet.timestamp = Date.now();

        await worksheet.save();

        return res.status(200).send({ status: 'ok', msg: 'success', worksheet });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to edit worksheet
router.post('/edit_worksheet', upload.single('profile-pic'), async (req, res) => {
    const { token, topic, week, subject_name, term, session, category, class_name, questions, worksheet_id } = req.body;

    // check for required fields
    if (!token || !worksheet_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch worksheet document
        let worksheet = await Worksheet.findById({ _id: worksheet_id }).lean();

        // // upload profile picture
        let img_url = '';
        let img_id = '';
        if (req.file) {
            if (worksheet.img_id != '') {
                await cloudinary.uploader.destroy(worksheet.img_id);
            }
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'worksheet-profile-pictures' });
            console.log(result);
            img_url = result.secure_url;
            img_id = result.public_id;
        }

        worksheet = await Worksheet.findByIdAndUpdate(
            { _id: worksheet_id },
            {
                topic: topic || worksheet.topic,
                term: term || worksheet.term,
                week: week || worksheet.week,
                subject_name: subject_name || worksheet.subject_name,
                session: session || worksheet.session,
                category: category || worksheet.category,
                class_name: class_name || worksheet.class_name,
                img_url: img_url || worksheet.img_url,
                img_id: img_id || worksheet.img_id,
                questions: questions || worksheet.questions,
            },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', worksheet });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view worksheet
router.post('/view_worksheet', async (req, res) => {
    const { token, worksheet_id } = req.body;

    // check for required fields
    if (!token || !worksheet_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch worksheet document
        const worksheet = await worksheet.findById({ _id: worksheet_id }).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', worksheet });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view class worksheets
router.post('/view_current_session_worksheets', async (req, res) => {
    const { token, class_name, subject, week } = req.body;

    // check for required fields
    if (!token || !class_name || !subject || !week)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch worksheet document
        const worksheets = await Worksheet.find({ is_deleted: false, class_name, subject_name: subject, week }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

        // check if worksheets exist
        if (worksheets.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no worksheets at the moment', count: 0, worksheets: [] });

        return res.status(200).send({ status: 'ok', msg: 'success', worksheets, count: worksheets.length });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to delete worksheet
router.post('/delete_worksheet', async (req, res) => {
    const { token, worksheet_id } = req.body;

    // check for required fields
    if (!token || !worksheet_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch worksheet document
        await Worksheet.updateOne({ _id: worksheet_id }, { is_deleted: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success' });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to upload files
router.post('/upload_files', upload.array('worksheet-images'), async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token || req.files === undefined || req.files === null)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        const admin = jwt.verify(token, process.env.JWT_SECRET);

        // upload files
        const urls = [];
        const ids = [];
        for (let i = 0; i < req.files.length; i++) {
            const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'worksheet-images' });
            urls.push(result.secure_url);
            ids.push(result.public_id);
        }

        return res.status(200).send({ status: 'ok', msg: 'success', ca_imgs: { urls, ids } });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// delete files
router.post('/delete_files', async (req, res) => {
    const { token, ids } = req.body;

    // check for required fields
    if (!token || !ids)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // delete files      
        for (let i = 0; i < ids.length; i++) {
            await cloudinary.uploader.destroy(ids[i]);
        }

        return res.status(200).send({ status: 'ok', msg: 'success' });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

module.exports = router;