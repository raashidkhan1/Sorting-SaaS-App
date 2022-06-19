# Sorting-as-a-service

For GCP setup instructions - check GCP Commands
This project requires Node = 16.10 as this is the max version on GCP.
------
## Install node and yarn
on Mac - Use brew
### brew install node@16.10

then install yarn with 
### npm install yarn

on Win - Install through chocolatey or use the exe from Node js [website](https://nodejs.org/en/download/current/). Download 16.10 only

then install yarn with 
### npm install yarn

To start with the project - 
First install dependencies from the root of the project-
### yarn install
this will install dependencies for both client and server

## The folder structure is as follows-
## Client
Contains front end code. For working locally - these are the commands-

Starts a development server
### yarn start

# if app start fails
Remove node_modules and yarn.lock
### rm -rf node_modules yarn.lock

Install latest react-scripts
### yarn add -D react-scripts@latest

 and rerun ~ yarn start
 
 To build a production version use
 ### yarn build
 
 ## Server
 
 The server connects to a mysql database. There is also a .env file in the root of the project, make sure you use the same names and credentials when creating the instance.
 If you are on mysql commandline, 
 1) First create a db instance on GCP- sorting-as-a-service-dbinstance
 2) create a database - sorting-as-a-service-db
 3) run the table.sql script to create the required table.
 
Contains APIS to connect with backend and execute SQL queries. No need to build just start the server with-
### yarn start

APIs require payloads from the client, hence you can test them with the front end page and attach a debugger to VS code when running the app server
