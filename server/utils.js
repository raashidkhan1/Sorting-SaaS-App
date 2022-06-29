const crypto = require('crypto')
const readline = require("readline");
const stream = require("stream");
const {CHUNK_SIZE} = require("./constants");

// generate unique ids from storing a job in database
function generateUniqueId() {
    return crypto.randomBytes(6).toString('hex')
}

// calculate chunk start and end bytes
const getByteRanges = (file, handler) => {
    let lines = 0;
    let chunks = []
    let startingByte = 0;
    let lastByteLength = 0;
    let endingByte = 0;
    let lastCursor = -1;
  
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file);
    let lineReader = readline.createInterface({
      input: bufferStream,
      terminal: false,
    });
    let filedata = file.toString('utf-8');
    let fileSizeInBytes = Buffer.byteLength(filedata);
    lineReader.on('line', (input) => {
      lines++;
      endingByte++;
      lastByteLength = Buffer.byteLength(input);
      endingByte += lastByteLength;
  
      if(endingByte-startingByte>CHUNK_SIZE) {
        chunks.push({
          startByte: startingByte, 
          endByte: endingByte
        })
        lastCursor = endingByte;
        startingByte = endingByte+1;
      }
      if(endingByte > fileSizeInBytes){
        chunks.push({
          startByte: startingByte, 
          endByte: fileSizeInBytes
        })
      }
    });
    lineReader.on('close', ()=>{
      handler(chunks);
      // console.log(chunks);
    })
  
  }

module.exports = {
    generateUniqueId,
    getByteRanges
}