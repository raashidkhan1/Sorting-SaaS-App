require('dotenv').config({path: "../"});

const multer = require("multer");
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const {Storage} = require('@google-cloud/storage');

// Instantiate a storage client
const storage = new Storage({
  // keyFilename: process.env.DOWNLOAD_KEY //for localhost
});

// A bucket is a container for objects (files).
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// local data storage 
// const storage = multer.diskStorage({
//   //Specify the destination directory where the file needs to be saved
//   destination: function (req, file, cb) {
//     cb(null, "./uploads");
//   },
//   //Specify the name of the file. date is prefixed to avoid overwrite of files.
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// file size limit is 300 MiB, and only plain .txt files are allowed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 300 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "text/plain" ||
      file.mimetype == "plain/text"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("INVALID_TYPE"));
    }
  },
});

module.exports = {
  upload,
  bucket
};
