import base64
import pandas as pd
import os
import gcsfs
import json
import requests

#from gcloud import storage
from google.cloud import storage
storage_client = storage.Client()
def hello_pubsub(event, context):
    """Triggered from a message on a Cloud Pub/Sub topic.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    print("Processing",pubsub_message)
#     pubsub_message1 = base64.b64decode(event['data']).decode('utf-8')
#     print("before encoding",pubsub_message1)
#     pubsub_message = json.loads(base64.b64decode(event['data']))
#     print ("the file name is",pubsub_message['filename'])
#     print("after json encoding",pubsub_message)
  


    ##############################
    bucket = storage_client.get_bucket('object-storage')
    blob_names = [blob.name for blob in bucket.list_blobs(prefix='tomerge/', delimiter='/')]
    #merging(blob_names)
    print("names of the files",blob_names)
 
      
    #blob = bucket.blob('tomerge/file1.txt') #tomerge/file1.txt
    #print("reading the file")
    #contents = blob.download_as_text() #read file
    #print(contents)

    
    allfiles = []
    blobs = bucket.list_blobs(prefix='tomerge/', delimiter='/')
    
    print("Blobs:")
    for blob in blobs:
          s = blob.download_as_string()
          allfiles.append(s)
    print("appended all files",allfiles)
    #merge sort intermediate results
    results = merge_sort(allfiles)
    print("the final output is",results)
    #writing intermidate results to a file 
    toupload = writetofile(results,'/tmp/final.txt')
     #upload final results to cloud storage in order to parse it to front-end
    finalfile = "sorted-" + pubsub_message 
    upload_blob(bucket_name = 'object-storage', source_file_name = toupload, destination_blob_name = finalfile)
    blobss = bucket.list_blobs(prefix='tomerge/')
    for blob in blobss:
          blob.delete()
    print("Deleting chunks from the CS") 
    #for blob in blobs:
     #    delete_blob(bucket_name='object-storage', blob_name=blob.name)






def writetofile(intermidateresults, destinationfile):
     with open(destinationfile, 'wb') as f:

      for element in intermidateresults:
       f.write(element)
     return destinationfile


def merge_sort(x):
    print("Merging the intermidate results")
    if len(x) < 2:return x

    result,mid = [],int(len(x)/2)

    y = merge_sort(x[:mid])
    z = merge_sort(x[mid:])

    while (len(y) > 0) and (len(z) > 0):
            if y[0] > z[0]:result.append(z.pop(0))   
            else:result.append(y.pop(0))

    result.extend(y+z)
	
    return result


def merging(filenames):
     # Python program to
     # demonstrate merging of
     # two files

     # Creating a list of filenames
     #filenames = ['file1.txt', 'file2.txt']

     # Open file3 in write mode
     print("start Merging")
     with open('file3.txt', 'w') as outfile:

          # Iterate through list
          for names in filenames:

               # Open each file in read mode
               with open(names) as infile:

                    # read the data from file1 and
                    # file2 and write it in file3
                    outfile.write(infile.read())

               # Add '\n' to enter data of file2
               # from next line
               outfile.write("\n")
     return outfile


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
