const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");
const File = require("../models/file");

dotenv.config();
const router = express.Router();

// upload newsletter
router.post("/upload_newsletter", upload.single("file"), async (req, res) => {
    const { token, filename } = req.body;

    // check for required fields
    if (!token || !filename || req.file === undefined)
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // upload file
        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: "files",
        });

        // create a new file document and populate it
        let file = new File();
        file.filename = filename;
        file.file_url = secure_url;
        file.file_id = public_id;
        file.timestamp = Date.now();

        await file.save();
        delete file.file_id;

        return res.status(200).send({ status: "ok", msg: "Success", file });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ status: "error", msg: "some error occurred", e });
    }
}
);

// endpoint to view a single newsletter
router.post("/view_newsletter", async (req, res) => {
    const { file_id } = req.body;

    // check for required fields
    if (!file_id)
        return res
            .status(400)
            .send({ status: "error", msg: "all fields must be filled" });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch file document
        const file = await File.findById({ _id: file_id }, { file_id: 0 }).lean();

        return res.status(200).send({ status: "ok", msg: "Success", file });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ status: "error", msg: "some error occurred", e });
    }
});

// endpoint to view newsletters
router.post("/view_newsletters", async (req, res) => {
    const { token } = req.body;

    // check for required fileds
    if (!token)
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch file document
        const files = await File.find(
            {},
            { file_id: 0 }
        ).lean();

        // check if file exist
        if (files.length === 0)
            return res
                .status(200)
                .send({ status: "ok", msg: "no files at the moment", count: 0, files });

        return res
            .status(200)
            .send({ status: "ok", msg: "success", files, count: files.length });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ status: "error", msg: "some error occurred", e });
    }
});

/**
 * Endpoint to delete newsletter
 * @param {string} file_id the file_id field used in deleting files in cloudinary
 * @param {string} _id the _id of the document
 */
router.post("/delet_newsletter", async (req, res) => {
    const { file_id, _id } = req.body;

    // check for required fields
    if (!file_id || !_id)
        return res
            .status(400)
            .send({ status: "error", msg: "all fields must be filled" });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // delete file from 
        await cloudinary.uploader.destroy(file_id);

        // delete document
        await File.deleteOne({ _id });

        return res.status(200).send({ status: "ok", msg: "Success" });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ status: "error", msg: "some error occurred", e });
    }
});
module.exports = router;