const express = require("express");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dotenv = require("dotenv");
dotenv.config();


// Dump directory path
const dumpDir = "./backup";

// Function to perform mongodump
const het = async () => {
    const performBackup = async () => {
        const dumpCommand = `mongodump --uri="${process.env.MONGO_URI}" --out="${dumpDir}"`;
    
        try {
            const { stdout, stderr } = await exec(dumpCommand);
    
            if (stderr) {
                console.error(`Error during mongodump: ${stderr}`);
                throw new Error(`Error during mongodump: ${stderr}`);
            } else {
                console.log('Backup completed successfully!');
                return { status: "success", msg: 'Backup completed successfully!' };
            }
        } catch (error) {
            console.error(`Error during mongodump: ${error.message}`);
            throw new Error(`Error during mongodump: ${error.message}`);
        }
    };
    await performBackup();
}
het();

// Perform backup immediately
