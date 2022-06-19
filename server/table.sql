## create a table

USE sorting-as-a-service-db;
DROP TABLE IF EXISTS jobs;

CREATE TABLE jobs (job_id VARCHAR(20) NOT NULL, filename VARCHAR(255), 
isProcessed BOOLEAN, completion_perc VARCHAR(255), PRIMARY KEY(job_id));

SELECT * FROM jobs;