require('dotenv').config({path: '../'})

const {PubSub} = require('@google-cloud/pubsub');

// TOPICS for sorting and palindrome
const TOPIC_SORT = process.env.PUBSUB_TOPIC_SORT;
const TOPIC_PALINDROME = process.env.PUBSUB_TOPIC_PALINDROME;

// Initialize a PUBSUB object
const pubsub = new PubSub({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
});

// Initialize the topics
const sort_topic_pubsub = pubsub.topic(TOPIC_SORT);
const palind_topic_pubsub = pubsub.topic(TOPIC_PALINDROME);

// Publish messages to topics
async function publishtoPubSub(chunks, jobId, filename) {
    let sort_message_id = null;
    let palind_message_id = null;
    chunks.forEach(async (chunk, index)=>{
        let publishData = {
            jobId: jobId,
            filename: filename, 
            startByte: chunk.startByte, 
            endByte: chunk.endByte,
            lastChunk: false,
            totalChunks: chunks.length
        };
        
        if (index === chunks.length - 1 ){
            publishData.lastChunk = true;
        }

        let message = {
            data: Buffer.from(JSON.stringify(publishData))
        };
        try {
            // Publishes the message
            sort_message_id = await sort_topic_pubsub.publishMessage(message);
            palind_message_id = await palind_topic_pubsub.publishMessage(message);
            if(sort_message_id && palind_message_id){
                console.log("Message published for sort:", sort_message_id, "and for palindrome", palind_message_id);
            }
        } catch (error) {
            console.error(`Received error while publishing: ${error.message}`);   
        }
    });
}

module.exports = {
    publishtoPubSub
}
