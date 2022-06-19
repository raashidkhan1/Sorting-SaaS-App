const getChunks = (file) => {
    let offset = 0;
    const chunkSize = 1024; // 1KB
    const fileSize = file.size;
    let i=0;
    let chunks = [];
    while(i<fileSize){
      chunks.push(file.slice(offset, offset + chunkSize));
      offset += chunkSize;
      i += chunkSize;
    }
    return chunks;
}

module.exports ={
    getChunks
}