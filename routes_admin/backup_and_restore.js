const express = require("express");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const jwt = require("jsonwebtoken");

const Job = require("../models/job");

const router = express.Router();

dotenv.config();


// Dump directory path
const dumpDir = '../backup';

// endpoint to schedule backup
router.post("/backup", async (req, res) => {
  const { token } = req.body;

  try {
    // Check for required fields
    if (!token) {
      return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // Function to perform mongodump
    const performBackup = async () => {
      const dumpCommand = `mongodump --uri="${process.env.MONGO_URI}" --out="${dumpDir}"`;

      try {
        const { stdout, stderr } = await exec(dumpCommand);

        if (stderr) {
          console.error(`Error during mongodump: ${stderr}`);
          throw new Error(`Error during mongodump: ${stderr}`);
        } else {
          console.log('Backup completed successfully!');
          return { status: "success", msg: 'Backup completed successfully!'};
        }
      } catch (error) {
        console.error(`Error during mongodump: ${error.message}`);
        throw new Error(`Error during mongodump: ${error.message}`);
      }
    };

    // Perform backup immediately
    await performBackup();

    // Schedule backup to run every Sunday at midnight
    const job = schedule.scheduleJob('0 0 * * 0', async () => {
      await performBackup();
    });

    // Update job document
    await Job.updateOne({event: 'backup_and_update'}, { job, timestamp: Date.now(), event: 'backup_and_update' }, { upsert: true });

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", error: e.message });
  }
});

// endpoint to restore
router.post("/restore", async (req, res) => {
  const { token } = req.body;

  try {
    // Check for required fields
    if (!token) {
      return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // Function to restore
    const performRestore = async () => {
      const restoreCommand = `mongorestore --uri="${process.env.MONGO_URI}" "${dumpDir}"`;

      const { stdout, stderr } = await exec(restoreCommand);

      if (stderr) {
        console.error(`Error during mongorestore: ${stderr}`);
        throw new Error(`Error during mongorestore: ${stderr}`);
      } else {
        console.log('Restore completed successfully!');
        return { status: "success", msg: `Restore completed successfully` };
      }
    };

    // Perform restore
    const result = await performRestore();

    return res.status(200).send(result);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", error: e.message });
  }
});

// endpoint to stop scheduling backup
router.post("/stop_scheduling_backup", async (req, res) => {
  const { token } = req.body;

  // check for required fields
  if (!token)
    return res.status(400).send({ status: "error", msg: "required fields must be filled" });

  try {
    // token verification
    jwt.verify(token, process.env.JWT_SECRET);

    // fetch job 
    const {job} = await Job.findOne({}, {job: 1}).lean();

    // check if job was found
    if(!job)
      return res.status(400).send({status: "error", msg: "no schedule was set"});

    // stop the schedule
    job.cancel();

    // delete job document
    await Job.deleteOne({}, {sort: {timestamp: 1}});

    return res.status(200).send({ status: "ok", msg: "success" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: "error", msg: "some error occurred", error: e.message });
  }
});

module.exports = router;