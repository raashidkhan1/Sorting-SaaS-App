require('dotenv').config({path: '../'})

const {PubSub} = require('@google-cloud/pubsub');
const {PUBSUB_API_ENDPOINT} = require('../constants');

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
// const {PUBSUB_VERIFICATION_TOKEN} = process.env;
const TOPIC_SORT = process.env.PUBSUB_TOPIC_SORT;
const TOPIC_PALINDROME = process.env.PUBSUB_TOPIC_PALINDROME;


const pubsub = new PubSub({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
    // keyFilename: process.env.PUBSUB_SERVICE_ACCOUNT //for local run
});

const sort_topic_pubsub = pubsub.topic(TOPIC_SORT);
const palind_topic_pubsub = pubsub.topic(TOPIC_PALINDROME);

async function publishtoPubSub(chunks, filename) {
    chunks.forEach(async (chunk)=>{
        let publishData = {
            file_name: filename, 
            startByte: chunk.startByte, 
            endByte: chunk.endByte
        };
        // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
        
        if (chunk.index === chunks.size - 1){
            publishData.lastChunk = true;
        }

        let message = {
            data: Buffer.from(JSON.stringify(publishData))
        };
        try {
            // Publishes the message
            let sort_message_id = await sort_topic_pubsub.publishMessage(message);
            let palind_message_id = await palind_topic_pubsub.publishMessage(message);
            console.log("Message published", sort_message_id, palind_message_id);
        } catch (error) {
            console.error(`Received error while publishing: ${error.message}`);   
        }

    });
}

module.exports = {
    publishtoPubSub
}
