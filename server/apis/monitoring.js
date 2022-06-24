require('dotenv').config({path: '../.env'})

const monitoring = require('@google-cloud/monitoring');

const client = new monitoring.MetricServiceClient({
    keyFilename: process.env.METRICS_SA
});

async function readUnacknowledgedMessages(){
    const metricType = 'pubsub.googleapis.com/topic/num_unacked_messages_by_region';

    const request = {
        name: client.projectPath("sorting-as-a-service"),
        filter: `metric.type="${metricType}" AND resource.type="pubsub_topic" AND 
        resource.label."topic_id"="sorting"`,
        interval: {
          startTime: {
            // Limit results to the last 5 minutes
            seconds: Date.now() / 1000 - 60 * 5,
          },
          endTime: {
            seconds: Date.now() / 1000,
          },
        },
    };

    const response = await client.listTimeSeries(request);
    
    if (response && response.length > 0 && response[0].length > 0 &&
        response[0][0].points && response[0][0].points.length > 0) {
        const point = response[0][0].points[0];

        if (point.value && point.value.int64Value) {
            const value = parseInt(point.value.int64Value, 10);
            if (isFinite(value)) {
                console.log(value);
                return value;
            }
        }
    } else {
        return null
    }


}

module.exports ={
    readUnacknowledgedMessages
}

