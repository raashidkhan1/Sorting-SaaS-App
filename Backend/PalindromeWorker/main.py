# Write Python 3 code in this online editor and run it.
import base64
import pandas as pd
import os
import gcsfs
import json

#from gcloud import storage
from google.cloud import storage
from google.cloud import pubsub_v1


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
    
    print("after json encoding",pubsub_message)
    newfilename = pubsub_message['filename']
    starting = pubsub_message['startByte']
    ending = pubsub_message['endByte']
    print ("the file name is",newfilename)
    print("starting from",starting)
    print("until byte",ending)

        
    #connecting to Cloud storage API through its library and getting the file name from the front end message
    bucket = storage_client.get_bucket('example-sortbucket')
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
    write_to_blob(bucket_name="example-sortbucket",file_name="intermediatepalindrome.txt")
    #download this file from the storage to edit on it and write the intermeidate results of the current chunk
    blob = bucket.blob("intermediatepalindrome.txt")
    blob.download_to_filename("/tmp/localintermediate.txt")

    # the following function to write the intermediate results of this chunk to file
    updatedfileresults = writetofile(length,count,"/tmp/localintermediate.txt")

    #upload the new intermediate results to the bucket again to compare with future messages (cunks)
    upload_blob('example-sortbucket', updatedfileresults , "intermediatepalindrome.txt")
    #in case this is the lastes chunks we want to delete the intermediate results from the cloud stroage(to stop compare with other chunks)
    delete_blob(bucket_name='example-sortbucket', blob_name='intermediatepalindrome.txt')

    #in case this is the lastes chunk of the file we want to send a message to the reduce worker with the final results
    #publishing message to reduce function
    publish()
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
        if  file.read() != "":
		#file is not empty
            print("inside if")
			#reading the num of palindrome words from the intermediate results and summing to the current value
            inter1 = int(contnet[0])   #lengest word
            inter2 = int(contnet[1])   # the number of words
            cont = cont + inter2
			# compare the old leght with the new one from the new chunk
            if (lengh>inter1):
                contnet[0] = str(lengh)
                file.write(contnet[0])


        else: #file is empty
            file.write(str(lengh)+"\n")
            file.write(str(cont))
			
    with open(localfilename, 'w') as f:
        f.write(str(lengh)+"\n")
        f.write(str(cont))

    return  localfilename


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
def publish():
    topic_path = publisher.topic_path("focal-cache-350516", "reduce-topic")
    # Publishes a message
    print("start publishing")
    try:
        data = str("hello from sorting process")
        publish_future = publisher.publish(topic_path, data.encode("utf-8"))
        publish_future.result()  # Verify the publish succeeded
        return 'Message published.'
    except Exception as e:
        print(e)
        return (e, 500)
