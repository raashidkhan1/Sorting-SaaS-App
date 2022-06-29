# Write Python 3 code in this online editor and run it.
import base64
import pandas as pd
import os
import gcsfs
import json
import sqlalchemy

#from gcloud import storage
from google.cloud import storage
from google.cloud import pubsub_v1


def sql():
# Uncomment and set the following variables depending on your specific instance and database:
    connection_name = "sorting-as-a-service:europe-west1:sorting-as-a-service-dbinstance2"
#table_name = ""
#table_field = ""
#table_field_value = ""
    db_name = "sorting-as-a-service-db"
    db_user = "root"
    db_password = "dbinstance123"

# If your database is MySQL, uncomment the following two lines:
    driver_name = 'mysql+pymysql'
    query_string = dict({"unix_socket": "/cloudsql/{}".format(connection_name)})

# If your database is PostgreSQL, uncomment the following two lines:
#driver_name = 'postgres+pg8000'
#query_string =  dict({"unix_sock": "/cloudsql/{}/.s.PGSQL.5432".format(connection_name)})

# If the type of your table_field value is a string, surround it with double quotes.

    #request_json = request.get_json()
    #stmt = sqlalchemy.text('insert into {} ({}) values ({})'.format(table_name, table_field, table_field_value))
    
    db = sqlalchemy.create_engine(
      sqlalchemy.engine.url.URL(
        drivername=driver_name,
        username=db_user,
        password=db_password,
        database=db_name,
        query=query_string,
      ),
      pool_size=5,
      max_overflow=2,
      pool_timeout=30,
      pool_recycle=1800
    )
    try:
        with db.connect() as conn:
            print("connected to DB")
    except Exception as e:
        print( 'Error: {}'.format(str(e)))
    return db

pool = sql()
# Instantiates a Pub/Sub client
publisher = pubsub_v1.PublisherClient()
#PROJECT_ID = os.getenv("focal-cache-350516")

storage_client = storage.Client()
def process_pubsub_event(event, context):

    #message = base64.b64decode(event['data']).decode('utf-8')
    event_id = context.event_id
    event_type = context.event_type

    pubsub_message1 = base64.b64decode(event['data']).decode('utf-8')
    #print("before encoding",pubsub_message1)
    pubsub_message = json.loads(base64.b64decode(event['data']))
    lastchunk = False
    print("after json encoding",pubsub_message)
    newfilename = pubsub_message['filename']
    starting = pubsub_message['startByte']
    ending = pubsub_message['endByte']
    lastchunk = pubsub_message ['lastChunk']
    total = pubsub_message['totalChunks']
    jobid =  pubsub_message['jobId']
    print ("the file name is",newfilename)
    print("starting from",starting)
    print("until byte",ending)

        
    #connecting to Cloud storage API through its library and getting the file name from the front end message
    bucket = storage_client.get_bucket('object-storage')
    blob = bucket.blob(newfilename)
    print("reading the file")
    #contents = blob.download_as_string() #read file
    #contents = blob.download_as_text(encoding="utf-8")
    #download the specified chunk from the file to process it 
    blob.download_to_filename("/tmp/newggg.txt",start=starting,end=ending)
    #the following function for finding palindrome (count and longest word)
    length  ,count = readfile("/tmp/newggg.txt")

    #write these intermediate values to a file 
    #create an empty file in the storage to store the intermeidate results
    # if (starting == 0):
    #     print("create the file to store")
    #     write_to_blob(bucket_name="object-storage",file_name="intermediatepalindrome.txt")
    # #download this file from the storage to edit on it and write the intermeidate results of the current chunk
    # print (blob_exists("object-storage", "intermediatepalindrome.txt"))
    # blob = bucket.blob("intermediatepalindrome.txt")
    try:
        with pool.connect() as conn:
            print("hello to DB")
    except Exception as e:
        print( 'Error: {}')

    #update the query to the DB
    # myquery = sqlalchemy.text("UPDATE jobs SET length_of_pd={}, no_of_pd={} WHERE job_id='{}'".format(length, count, jobid))
    # pool.execute(myquery)
    #get values from DB

    getquery =  sqlalchemy.text("select length_of_pd , no_of_pd  from jobs WHERE job_id='{}'".format(jobid))
    print("the return value from DB is ")
    record = pool.execute(getquery).fetchall()

    

    for row in record:
        print("length from DB = ", row[0])
        print("count  from DB= ", row[1])
        dblength = row[0]
        dbcount = row[1]

    if (length >dblength):
        count = count +dbcount
        myquery = sqlalchemy.text("UPDATE jobs SET length_of_pd={}, no_of_pd={} WHERE job_id='{}'".format(length, count, jobid))
        pool.execute(myquery)
    else:
        count=count+dbcount
        myquery = sqlalchemy.text("UPDATE jobs SET length_of_pd={}, no_of_pd={} WHERE job_id='{}'".format(dblength, count, jobid))
        pool.execute(myquery)






    #blob.download_to_filename("/tmp/localintermediate.txt"+str(starting))

    # the following function to write the intermediate results of this chunk to file (comapre old value from previous messages to update the longst and increase the count)
    #updatedfileresults ,finallenght, finalcount,mycount = writetofile(length,count,"/tmp/localintermediate.txt"+str(starting))

    #upload the new intermediate results to the bucket again to compare with future messages (cunks)
    #upload_blob('object-storage', updatedfileresults , "intermediatepalindrome.txt")


    #in case this is the lastes chunk of the file we want to send a message to the reduce worker with the final results
    #publishing message to reduce function
    #print("my count", mycount)
    #if (mycount == total):
     #   print("this is the last chunk")
      #  print("the results",finalcount,finallenght)
       # publish(finalcount,finallenght)
        #in case this is the lastes chunks we want to delete the intermediate results from the cloud stroage(to stop compare with other chunks)
        #delete_blob(bucket_name='example-sortbucket', blob_name='intermediatepalindrome.txt')
    #sorting the file line by line
    #sorted_file = sortingfile("/tmp/newggg.txt")                


    print(f"A new event is received: id={event_id}, type={event_type}")
    #print(f"data = {message}")
    
                
    
def isPalindrome(s):
            return s == s[::-1]


def implicit():
    from google.cloud import storage

    # If you don't specify credentials when constructing the client, the
    # client library will look for credentials in the environment.
    storage_client = storage.Client()

    # Make an authenticated API request
    buckets = list(storage_client.list_buckets())
    print("reading from cloud storage")
    print(buckets)




def blob_exists(bucket_name, filename):
   client = storage.Client()
   bucket = client.get_bucket(bucket_name)
   blob = bucket.blob(filename)
   return blob.exists()

def GCSDataRead(event, context):
    bucketName = event['example-sortbucket']
    blobName = event['ggg.txt']
    fileName = "gs://" + bucketName + "/" + blobName
    
    dataFrame = pd.read_csv(fileName, sep=",")
    print("this is the file")
    print(dataFrame)
def  readfile(fily):

# Python program to read
# file word by word

# opening the text file
#with open('ggg.txt','r') as file:

	# reading each line
#  count = 0
#  lenght = 0
#  for line in fily:

# 		# reading each word
# 	 for word in line.split():
            
# 		# displaying the words
# 			if isPalindrome(word):
# 				count +=1
# 				if len(word) > lenght:
# 					lenght = len(word)

# #			#print(word)
#   print("the longest word length is", lenght)
#   print("the words number is ", count)
 with open(fily,'r') as file:
    lenght = 0
    num = 0
    for line in file:
        for word in line.split():
            if isPalindrome(word):
                num +=1
                if len(word) > lenght:
                    lenght = len(word)
    print("the longest palindrome word length is", lenght)
    print("the number of palindrome in the file is ", num)
 return lenght,num

def write_to_blob(bucket_name,file_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    blob.upload_from_string("")




def writetofile(lengh, cont,localfilename):
    print("editing the intermediate results")
    with open (localfilename , "r+") as file:
        contnet = file.readlines()
        file.seek(0)

        if  file.read() != "": #os.stat(localfilename).st_size == 0:
		#file is not empty
            print("inside if")
			#reading the num of palindrome words from the intermediate results and summing to the current value
            inter1 = int(contnet[0])   #lengest word
            inter2 = int(contnet[1])   # the number of words
            cont = cont + inter2
            #global count
            mycount = int (contnet[2])
            mycount = mycount +1
            contnet[2] = str(mycount)
			# compare the old leght with the new one from the new chunk
            if (lengh>inter1):
                contnet[0] = str(lengh) +'\n'
                #file.write(contnet[0])
                contnet[1] = str(cont) +'\n'
                #file.write(contnet[1])
                
            else:
                contnet[1] = str(cont) +'\n'
                lengh = inter1

            with open (localfilename,'w') as file:
              file.writelines(contnet)

        else: #file is empty
         file.write(str(lengh)+"\n")
         file.write(str(cont)+"\n")
         file.write(str(1))
         mycount =1     

    return  localfilename,lengh, cont , mycount


def sortingfile(fily):

 #fn = 'filename.txt'
 sorted_fn = '/tmp/sortedfilename.txt'
 print("sorting the file")
 with open(fily, 'r') as f:
  l = [line for line in f if line.strip()]

 l.sort(key=lambda line:line.split()[1])

 with open(sorted_fn, 'w') as f:
  for line in l:
    f.write(line)
 return sorted_fn

def upload_blob(bucket_name, source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # The ID of your GCS bucket
    # bucket_name = "your-bucket-name"
    # The path to your file to upload
    # source_file_name = "local/path/to/file"
    # The ID of your GCS object
    # destination_blob_name = "storage-object-name"

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    print(
        f"File {source_file_name} uploaded to {destination_blob_name}."
    )


def delete_blob(bucket_name, blob_name):
    """Deletes a blob from the bucket."""
    # bucket_name = "your-bucket-name"
    # blob_name = "your-object-name"

    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.delete()

    print(f"Blob {blob_name} deleted.")


# Publishes a message to a Cloud Pub/Sub topic.
def publish(count,length):
    topic_path = publisher.topic_path("sorting-as-a-service", "Palidrome-Results")
    # Publishes a message
    print("start publishing")
    message_json = json.dumps({
       'data':  {'numberOfPalindromes': count , 'longestPalindromLength': length},
    })
    message_bytes = message_json.encode('utf-8')

    try:
        #data = str("hello from palindrome process")
        #publish_future = publisher.publish(topic_path, data.encode("utf-8"))
        publish_future = publisher.publish(topic_path, data=message_bytes)
        publish_future.result()  # Verify the publish succeeded
        return 'Message published.'
    except Exception as e:
        print(e)
        return (e, 500)
