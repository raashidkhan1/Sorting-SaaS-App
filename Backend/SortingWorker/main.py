# Write Python 3 code in this online editor and run it.
import base64
import pandas as pd
import os
import gcsfs
import json

#from gcloud import storage
from google.cloud import storage


storage_client = storage.Client()
def sortingworker(event, context):

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
    #connecting to the cloud storage and list the files
    implicit()
    
    bucket = storage_client.get_bucket('example-sortbucket')
    blob = bucket.blob(newfilename)
    print("reading the file")
    #contents = blob.download_as_string() #read file
    #contents = blob.download_as_text(encoding="utf-8")
    blob.download_to_filename("/tmp/newggg.txt",start=starting,end=ending)

    #sorting the file line by line
    sorted_file = anothersorting("/tmp/newggg.txt")
    #uploading the file to the bucket , we need to choose diffirent file name for each intermediate results upload so that the old intermediate results are not overwritten by new instance processing the same file
    infilename = str(starting)
    toupload = "tomerge/intermediate_Sorting" + infilename
    upload_blob('example-sortbucket', sorted_file , toupload)
   
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

 with open(fily,'r') as file:
    lenght = 0
    num = 0
    for line in file:
        for word in line.split():
            if isPalindrome(word):
                num +=1
                if len(word) > lenght:
                    lenght = len(word)
    print("the longest word length is", lenght)
    print("the words number is ", num)


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


def anothersorting(fily):
 sorted_fn = '/tmp/sortedfilename.txt'
 beforesorting = 'beforesorting.txt'
 print("Sorting the File")
 with open(fily, 'r') as file:
  lines = sorted(file.readlines())

 with open (sorted_fn,'w') as f:
  for line in lines:
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


	