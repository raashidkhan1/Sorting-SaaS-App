require('dotenv').config({path: '../'})

const mysql = require('mysql2');

// Database Connection for GCLOUD SQL

// let config = {
//     user: process.env.SQL_USER,
//     database: process.env.SQL_DATABASE,
//     password: process.env.SQL_PASSWORD,
// }

// if (process.env.INSTANCE_CONNECTION_NAME) {
//   config.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
// }

// let connection = mysql.createConnection(config);

// Database Connection for Development

let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.SQL_USER,
    database: process.env.SQL_DATABASE,
    password: process.env.SQL_PASSWORD
  });
  
connection.connect(function(err) {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected as thread id: ' + connection.threadId);
});
  
module.exports = connection;