const {format} = require('util');
const express = require("express");
const {upload, bucket} = require("./upload");
const multer = require("multer");
const cors = require("cors");

const app = express();

//Add the client URL to the CORS policy
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus:200,
};
app.use(cors(corsOptions));

app.post("/upload_file", upload.single("file"), function (req, res, next) {
  if (!req.file) {
    //If the file is not uploaded, then throw custom error with message: FILE_MISSING
    throw Error("FILE_MISSING");
  } else {
    // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );

    //If the file is uploaded, then send a success response.
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);


    //If the file is uploaded, then send a success response.
    // res.send({ status: "success" });
  }
});

//Express Error Handling
app.use(function (err, req, res, next) {
  // Check if the error is thrown from multer
  if (err instanceof multer.MulterError) {
    res.statusCode = 400;
    res.send({ code: err.code });
  } else if (err) {
    // If it is not multer error then check if it is our custom error for FILE_MISSING & INVALID_TYPE
    if (err.message === "FILE_MISSING" || err.message === "INVALID_TYPE") {
      res.statusCode = 400;
      res.send({ code: err.message });
    } else {
      //For any other errors set code as GENERIC_ERROR
      res.statusCode = 500;
      res.send({ code: "GENERIC_ERROR" });
    }
  }
});

//Start the server in port 8081
const server = app.listen(8081, function () {
  const port = server.address().port;

  console.log("App started at http://localhost:%s", port);
  console.log('Press Ctrl+C to quit.');
});
