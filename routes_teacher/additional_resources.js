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
    const { token, lesson_no, lesson_type, description, title, class_name, subject_name, week, term, session} = req.body;

    // check for required fields
    if (!token || !week || !term || !lesson_no || !lesson_type || !description || !class_name || !subject_name || !title || req.files == null || req.files == undefined)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload profile file
        
        let lesson_url = '';
        let lesson_id = '';
        let thumbnail_url = '';
        let thumbnail_id = '';
        for (let i = 0; i < req.files.length; i++) {
            let ext = path.extname(req.files[i].originalname);
            console.log(ext);
            if (ext == '.pdf') {
                const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'additional resourcess' });
                lesson_url = result.secure_url;
                lesson_id = result.public_id;
            }
            
            if(ext == '.mkv' || ext == '.mp4'){
                const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'additional resourcess', resource_type: "video", chunk_size: 6000000});
                lesson_url = result.secure_url;
                lesson_id = result.public_id;
            }

            if(ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') {
                const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'additional resourcess'});
                thumbnail_url = result.secure_url;
                thumbnail_id = result.public_id;
              }
        }

        // create a new additional_resources document and populate it
        let additional_resources = new AdditionalResources;
        additional_resources.title = title;
        additional_resources.term = term;
        additional_resources.session = session;
        additional_resources.week = week;
        additional_resources.class_name = class_name;
        additional_resources.subject_name = subject_name;
        additional_resources.lesson_no = lesson_no;
        additional_resources.lesson_type = lesson_type;
        additional_resources.description = description;
        additional_resources.lesson_url = lesson_url || '';
        additional_resources.lesson_id = lesson_id || '';
        
        additional_resources.thumbnail_url = thumbnail_url || '';
        additional_resources.thumbnail_id = thumbnail_id || '';
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
        let lesson_url = '';
        let lesson_id = '';
        let thumbnail_url = '';
        let thumbnail_id = '';
        for (let i = 0; i < req.files.length; i++) {
            let extname = path.extname(req.files[i].originalname);
            if (extname == '.pdf') {
                if (additional_resources.lesson_id != '') {
                    await cloudinary.uploader.destroy(additional_resources.lesson_id);
                }
            } else {
                if (additional_resources.thumbnail_id != '') {
                    await cloudinary.uploader.destroy(additional_resources.thumbnail_id);
                }
            }
            const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'additional_resourcess' });
            let ext = path.extname(req.files[i].originalname);
            if (ext == '.pdf') {
                lesson_url = result.secure_url;
                lesson_id = result.public_id;
            } else {
                thumbnail_url = result.secure_url;
                thumbnail_id = result.public_id;
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
                lesson_url: lesson_url || additional_resources.lesson_url,
            lesson_id: lesson_id || additional_resources.lesson_id,
                thumbnail_url: thumbnail_url || additional_resources.thumbnail_url,
                thumbnail_id: thumbnail_id || additional_resources.thumbnail_id
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
router.post('/view_multiple_additional_resources_filter', async (req, res) => {
    const { token, week, subject_name, class_name, term } = req.body;

    // check for required fields
    if (!token || !week || !subject_name || !class_name || !term)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch additional_resources document
        const additional_resources = await AdditionalResources.find({ is_deleted: false, week, subject_name, term, class_name }, { is_deleted: 0, timestamp: 0 }).lean();

        // check if additional_resourcess exist
        if (additional_resources.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no additional_resourcess at the moment', count: 0, additional_resources: []});

        return res.status(200).send({ status: 'ok', msg: 'success', additional_resources, count: additional_resources.length });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to delete additional_resources
router.post("/delete_additional_resources", async (req, res) => {
    const { token, additional_resources_id, additional_resources_material_id } =
      req.body;
      
      //console.log(`--------------->${additional_resources_id} || ${additional_resources_material_id}`);
  
    // check for required fields
    if (!token || !additional_resources_id || !additional_resources_material_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
  
    try {
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);
  
      // fetch additional_resources document
      // await AdditionalResources.updateOne({ _id: additional_resources_id }, { is_deleted: true }).lean();
  
      // Attempt to delete the resource from Cloudinary
      await cloudinary.uploader.destroy(
        additional_resources_material_id
      );
  
      //console.log(`------> ${JSON.stringify(cloudinaryDeletionResult)}`);
  
      
      
        await AdditionalResources.deleteOne({
          _id: additional_resources_id,
        }).lean();
  
        return res.status(200).send({ status: "ok", msg: "success" });
      
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });
module.exports = router;
