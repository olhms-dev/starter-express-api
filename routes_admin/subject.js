const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Subject = require('../models/subject');

dotenv.config();
const router = express.Router();

// endpoint to create subject
router.post('/create_subject', async (req, res) => {
  const {token, subject_name, school, preview, class_name, lessons} = req.body;

  // check for required fields
  if(!token || !subject_name || !class_name || !school)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    let subject_found = await Subject.findOne({subject_name, class_name}).lean();

    if(subject_found)
      return res.status(400).send({status: 'error', msg: 'subject already exist'});
    
    // create a new subject document and populate it
    let subject = new Subject;
    subject.subject_name = subject_name;
    subject.class_name = class_name;
    subject.school = school;
    subject.total_no_lessons = 0;
    subject.preview = preview || '';
    subject.lessons = lessons || [];
    subject.timestamp = Date.now();

    await subject.save();

    return res.status(200).send({status: 'ok', msg: 'success', subject});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view subjects
router.post('/view_subjects', async (req, res) => {
  const {token, class_name} = req.body;

  // check for required fields
  if(!token || !class_name)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subjects = await Subject.find({is_deleted: false, class_name}, {is_deleted: 0, timestamp: 0}).lean();

    // check if subjects exist
    if(subjects.length === 0)
      return res.status(200).send({status: 'ok', msg: 'no subjects at the moment at the moment', count: 0});

    return res.status(200).send({status: 'ok', msg: 'success', subjects, count: subjects.length});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view subject
router.post('/view_subject', async (req, res) => {
  const {token, subject_id} = req.body;

  // check for required fields
  if(!token || !subject_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findById({_id: subject_id}).lean();

    if(!subject)
      return res.status(403).send({status: 'ok', msg: 'subject not found'})

    return res.status(200).send({status: 'ok', msg: 'success', subject,});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to delete subject
router.post('/delete_subject', async (req, res) => {
  const {token, subject_id} = req.body;

  // check for required fields
  if(!token || !subject_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findByIdAndUpdate({_id: subject_id}, {is_deleted: true}, {new: true}).lean();

    return res.status(200).send({status: 'ok', msg: 'success', subject,});


  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to edit subject
router.post('/edit_subject', upload.array('subject_materials'), async (req, res) => {
  const {token, subject_id, school, subject_name, preview, class_name, deleted_urls, deleted_ids} = req.body;

  // check for required fields
  if(!token || !subject_id)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    const Admin = jwt.verify(token, process.env.JWT_SECRET);

    //upload files conditionally
    const urls = [];
    const ids = [];

    // delete files conditionally
    if(deleted_ids) {
      for(let i = 0; i < deleted_ids.length; i++){
        await cloudinary.uploader.destroy(deleted_ids[i]);
      }
    }

    if(req.files){
      if(req.files.length != 0){
        for(let i = 0; i < req.files.length; i++){
          let result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'subject materials', quality: 'auto', fetch_format: "auto"});
          urls.push(result.secure_url);
          ids.push(result.public_id);
        }
      }
    }
    
    // fetch and update document
    let subject = await Subject.findById({_id: subject_id}).lean();

    deleted_urls.forEach(deleted_url => {
      subject.urls.forEach((element, index) => {
        if(element == deleted_url) {
          subject.urls.splice(index, 1);
        }
      });
    });
    deleted_ids.forEach(deleted_id => {
      subject.ids.forEach((element, index) => {
        if(element == deleted_id) {
          subject.ids.splice(index, 1);
        }
      });
    });

    const urlsM = subject.urls.concat(urls);
    const idsM = subject.ids.concat(ids);
    subject = await Subject.findByIdAndUpdate(
      {_id: subject_id},
      {
        subject_name: subject_name || subject.subject_name,
        class_name: class_name || subject.class_name,
        school: school || subject.school,
        preview: preview || subject.preview,
        urls: urlsM || subject.urls,
        ids: idsM || subject.ids
      },
      {new: true}
    ).lean();

    return res.status(200).send({status: 'ok', msg: 'Success', subject});

  } catch(e) {
      console.log(e);
      return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to add a lesson
router.post('/add_lesson', async (req, res) => {
  const {token, subject_name, class_name, week_no, term} = req.body;

  // check for required fields
  if(!token || !subject_name || !class_name || !week_no || !term)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findOneAndUpdate(
      {class_name, subject_name}, {$push: {lessons: [{week_no, term, no_lessons: 0, lesson: []}]}}, {new: true}
    ).lean();

    return res.status(200).send({status: 'ok', msg: 'success', subject,});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to add class video or class note lesson materials
router.post('/add_lesson_materials', upload.array('lesson-materials'), async (req, res) => {
  const { token, lesson_no, lesson_type, description, title, class_name, subject_name, week_no, term, session, duration} = req.body;

  // check for required fields
  if (!token || !week_no || !term || !lesson_no || !lesson_type || !description || !class_name || !subject_name || !title || req.files == null || req.files == undefined)
    return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

  try {
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // upload profile file
    let lesson_url = '';
    let lesson_id = '';
    let thumbnail_id = '';
    let thumbnail_url = '';
    for (let i = 0; i < req.files.length; i++) {
      let ext = path.extname(req.files[i].originalname);
      if (ext == '.pdf') {
        const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'lesson materials' });
          lesson_url = result.secure_url;
          lesson_id = result.public_id;
      }
      if(ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') {
        const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'lesson materials'});
        thumbnail_url = result.secure_url;
        thumbnail_id = result.public_id;
      }
      if(ext == '.mkv' || ext == '.mp4') {
        const result = await cloudinary.uploader.upload(req.files[i].path, {folder: 'lesson materials', resource_type: "video", chunk_size: 6000000});
        lesson_url = result.secure_url;
        lesson_id = result.public_id;
      }
    }

    // update the lessons field of the particular subject document
    const subject = await Subject.findOne({subject_name, class_name});
    subject.lessons.forEach(element => {
      if(element.week_no == week_no && element.term === term) {
        element.lesson.push({
          title,
          lesson_url,
          lesson_id,
          lesson_no,
          lesson_type,
          duration: duration || '',
          thumbnail_url: thumbnail_url || '',
          thumbnail_id: thumbnail_id || '',
          description
        });
      }
    });

    await subject.save();

    return res.status(200).send({ status: 'ok', msg: 'success', subject });

  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
  }
});

// // endpoint to edit lesson material
// // the lesson_url is the lesson_url field in the lesson object that is to be updated
// router.post('/edit_lesson_material', upload.array('lesson-materials'), async (req, res) => {
//   const {token, subject_id, week_no, term, lesson_url, lesson_type, title, duration, description} = req.body;

//   // check for required fields
//   if(!token || !subject_id || !week_no || !term || !lesson_url)
//     return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

//   try{
//     // verify token
//     jwt.verify(token, process.env.JWT_SECRET);

//     // fetch subject document
//     const subject = await Subject.findOne({_id: subject_id, 'lessons.week_no': week_no, 'lessons.term': term});
//     let lesson_urlM = '';
//     let lesson_id = '';
//     if(req.files) {      
//       for (let i = 0; i < req.files.length; i++) {
//         const result = await cloudinary.uploader.upload(req.files[i].path, { folder: 'lessons' });
//         let ext = path.extname(req.files[i].originalname);
//         console.log(ext);
//         if (ext == '.pdf') {
//             pdf_url = result.secure_url;
//             pdf_id = result.public_id;
//         } else {
//             img_url = result.secure_url;
//             img_id = result.public_id;
//         }
//     }
//     }

//     if(!subject)
//       return res.status(403).send({status: 'ok', msg: 'no lesson at the moment'})

//     // delete lesson object from lessons array
//     let lesson_idM = '';
//     subject.lessons.forEach((element, index) => {
//       if(element.lesson_url == lesson_url) {
//         lesson_idM = element.lesson_id;
//         subject.lessons.splice(index, 1);
//       }
//     });
//     await cloudinary.uploader.destroy(lesson_idM);
//     await subject.save();

//     return res.status(200).send({status: 'ok', msg: 'success', subject,});

//   } catch(e) {
//     console.log(e);
//     return res.status(500).send({status: 'error', msg: 'some error occurred', e});
//   }
// });

// endpoint to delete lesson material
router.post('/delete_lesson_material', async (req, res) => {
  const {token, subject_id, week_no, term, lesson_url} = req.body;

  // check for required fields
  if(!token || !subject_id || !week_no || !term || !lesson_url)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findOne({_id: subject_id, 'lessons.week_no': week_no, 'lessons.term': term});

    if(!subject)
      return res.status(403).send({status: 'ok', msg: 'no lesson at the moment'})

    // delete lesson object from lessons array
    let lesson_id = '';
    subject.lessons.forEach((element, index) => {
      if(element.lesson_url == lesson_url) {
        lesson_id = element.lesson_id;
        subject.lessons.splice(index, 1);
      }
    });
    await cloudinary.uploader.destroy(lesson_id);
    await subject.save();

    return res.status(200).send({status: 'ok', msg: 'success', subject,});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to view lessons based on week and term
router.post('/view_lesson', async (req, res) => {
  const {token, subject_id, week_no, term} = req.body;

  // check for required fields
  if(!token || !subject_id || !week_no || !term)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});

  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch subject document
    const subject = await Subject.findOne({_id: subject_id, 'lessons.week_no': week_no, 'lessons.term': term}).lean();

    if(!subject)
      return res.status(403).send({status: 'ok', msg: 'no lesson at the moment'})

    let subjectM;
    subject.lessons.forEach(element => {
      if(element.week_no == week_no || element.term === term) {
        subjectM = element;
      }
    }) 

    return res.status(200).send({status: 'ok', msg: 'success', lesson: subjectM});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to upload file
router.post('/upload_file', upload.single('lessons'), async (req, res) => {
  const {token} = req.body;
  
  // check for required fields
  if(!token || req.file === undefined || req.file === null)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
    
  try{
    // verify token
    wt.verify(token, process.env.JWT_SECRET);
    
    // upload files
    let url = '';
    let id = '';        
    const result = await cloudinary.uploader.upload(req.file.path, {folder: 'lessons'});
    url = result.secure_url;
    id = result.public_id;

    return res.status(200).send({status: 'ok', msg: 'success', lesson: {url, id}});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

// endpoint to upload video
router.post('/upload_video', upload.single('lessons'), async (req, res) => {
  const {token} = req.body;
  
  // check for required fields
  if(!token || req.file === undefined || req.file === null)
    return res.status(400).send({status: 'error', msg: 'all fields must be filled'});
    
  try{
    // verify token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // upload video
    let video_url = '';
    let video_id = '';        
    const result = await cloudinary.uploader.upload(req.file.path, {folder: 'vlog-videos', resource_type: "video", chunk_size: 6000000});
    console.log(result);
    video_url = result.secure_url;
    video_id = result.public_id;

    return res.status(200).send({status: 'ok', msg: 'success', video_id, video_url});

  } catch(e) {
    console.log(e);
    return res.status(500).send({status: 'error', msg: 'some error occurred', e});
  }
});

module.exports = router;