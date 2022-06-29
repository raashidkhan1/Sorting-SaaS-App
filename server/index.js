require('dotenv').config()

const {format} = require('util');
const express = require("express");
const {upload, bucket} = require("./apis/upload");
const multer = require("multer");
const cors = require("cors");
const connection = require("./apis/database");
const {generateUniqueId, getByteRanges} = require('./utils');
const {publishtoPubSub} = require('./apis/pubsub');
const {readUnacknowledgedMessages} = require("./apis/monitoring");
const path = require('path');
const app = express();

//Add the client URL to the CORS policy
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus:200,
};
app.use(cors(corsOptions));
app.use(express.json());
// Using express static api to redirect to a static page
app.use(express.static(path.join(__dirname, '../client/build')));

// '/' path redirects to index.html
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// API for uploading file to google cloud bucket storage
app.post("/upload_file", upload.single("file"), function (req, res, next) {
  if (!req.file) {
    //If the file is not uploaded, then throw custom error with message: FILE_MISSING
    throw Error("FILE_MISSING");
  } else {
    // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    console.log(err);
    next(err);
  });

  blobStream.on('finish', () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    console.log("File uploaded to GCS and accessible on: ", publicUrl)
    //If the file is uploaded, then send a success response.
    res.status(200).send(blob.name);
  });

  blobStream.end(req.file.buffer);


    //If the file is uploaded, then send a success response.
    // res.send({ status: "success" });
  }
});

// API for getting job details
app.get("/get_job_details/:jobId", (req, res)=>{
  connection.query(      
    "SELECT * FROM jobs WHERE job_id = ?", req.params.jobId,
  function(error, results, fields) {
    if (error) throw error;
    res.json(results);
  }
);
});

// API for creating job
app.post("/create_job/:filename", (req, res)=>{
  const job_id = generateUniqueId();
  const file_name = req.params.filename;
  const processed = false;
  const completion_perc = 0;
  const values = [job_id, file_name, processed, completion_perc, 0, 0, 0];
  const sql_insert_query = "INSERT INTO jobs (job_id, filename, isProcessed, completion_perc, chunks, length_of_pd, no_of_pd) VALUES (?)"
  connection.query(sql_insert_query, [values], function(err, results, fields) {
      if (err) throw err;
      // return created job_id on successful table update
      res.status(200).json(job_id);
    }
  ).on('error', (err)=>{
    console.log(err);
    res.status(100).send("insert query failed")
  })
});

// API for downloading file
app.get("/download/:filename", async (req, res)=>{
  const options = {
    responseDisposition: "attachment",
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
  const file = bucket.file(`sorted-${req.params.filename}`);
  const fileExists = await file.exists();
  if(fileExists[0]){
    file.getSignedUrl(options).then((url)=>{
      res.header("Access-Control-Allow-Origin", "*");
      res.status(200).send(url);
    }).catch((error)=>{
      console.log(error);
      res.status(100).send("Error getting URL");
    }) 
  }
  else {
    res.status(100).send("File does not exist(yet)");
  }                                
});

// API for pubsub push
app.post("/pubsub/push/:jobId/:filename", (req, res)=>{
  try {
    publishtoPubSub(req.body, req.params.jobId, req.params.filename); 
    res.status(200).send("Success");
  } catch (error) {
    console.log("Error in publish", error)
    res.status(100).send("Error");
  }
});


// API for pubsub unacknowleged messages
app.get("/pubsub/unack/:filter", async (req, res)=>{
  try{
      const data = await readUnacknowledgedMessages(req.params.filter);
      if(data != null){
        res.status(200).json(data);
      } else {
        res.status(200).send(null);
      }
  } catch (error) {
    console.log("Error in reading metrics", error)
    res.status(100).send("Error");
  }
});

// API to update completeion percentage
app.put("/update_completion_perc", (req,res)=>{
  const sql_update_query = `UPDATE jobs SET completion_perc = ${req.body.completion_perc} WHERE job_id = '${req.body.jobId}'`;
  connection.query(sql_update_query, function(err, results, fields) {
      if (err) throw err;
      // return job_id on successful table update
      res.status(200).json(req.body.jobId);
    }
  ).on('error', (err)=>{
    console.log(err);
    res.status(100).send("update query failed");
  })
});

// API to get chunk ranges in bytes from the uploaded file
app.post("/get_byte_range", upload.single("file"), (req, res)=>{
  if(!req.file){
    //If the file is not uploaded, then throw custom error with message: FILE_MISSING
    throw Error("FILE_MISSING");
  }

  const handler = (chunks) => {
    res.status(200).json(chunks);
  }
  try {
    getByteRanges(req.file.buffer, handler);
  } catch (error) {
    console.log(error);
    res.status(100).send("Error");
  }
 
});

// API for updating isProcessed
app.post("/update_is_processed/:jobId/:isProcessed", (req, res)=>{
  const sql_update_query = `UPDATE jobs SET isProcessed = ${req.params.isProcessed}, completion_perc = ${100} WHERE job_id = '${req.params.jobId}'`;
  connection.query(sql_update_query, function(err, results, fields) {
      if (err) throw err;
      // return job_id on successful table update
      res.status(200).json(req.params.jobId);
    }
  ).on('error', (err)=>{
    console.log(err);
    res.status(100).send("update query failed");
  })
});

// API for updating no of chunks
app.post("/update_chunks/:jobId/:chunks", (req,res)=>{
  const sql_update_query = `UPDATE jobs SET chunks = ${req.params.chunks} WHERE job_id = '${req.params.jobId}'`;
  connection.query(sql_update_query, function(err, results, fields) {
      if (err) throw err;
      // return job_id on successful table update
      res.status(200).json(req.params.jobId);
    }
  ).on('error', (err)=>{
    console.log(err);
    res.status(100).send("update query failed");
  })
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

//Start the server on port 80
const server = app.listen(80, function () {
  const port = server.address().port;

  console.log("App started at http://localhost:%s", port);
  console.log('Press Ctrl+C to quit.');
});
