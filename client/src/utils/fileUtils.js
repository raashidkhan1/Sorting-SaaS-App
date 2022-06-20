const {CHUNK_SIZE} = require('../constants')
 
const getChunks = (file) => {
    let offset = 0;
    const chunkSize = CHUNK_SIZE; // in KB
    const fileSize = file.size;
    let i=0;
    let chunks = [];
    while(i<fileSize){
      let start = offset;
      let end = offset+chunkSize;
      if (end > fileSize){
        end = fileSize
      }
      chunks.push({startByte: start, endByte: end})
      offset += chunkSize;
      i += chunkSize;
    }
    return chunks;
}

module.exports ={
    getChunks
}