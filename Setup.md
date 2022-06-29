Using Cloud Shell

Create a artifact registry repository-
gcloud artifacts repositories create sorting-as-a-service-repo  --repository-format=docker  --location=europe-west1  --description="Docker repository"

Clone Cloud source repo on cloud shell with project id(here it is sorting-as-a-service)-
gcloud source repos clone <cloud-source-repository-name> --project=sorting-as-a-service

Authorise docker (europe-west1 is the chosen region)-
gcloud auth configure-docker europe-west1-docker.pkg.dev

Allow access to cloud storage bucket by making it public(object-storage is the bucket name)
gsutil defacl set public-read gs://object-storage

The following commands grant the Artifact Registry Repository Administrator and Storage Admin roles on a project-
  
gcloud projects add-iam-policy-binding sorting-as-a-service \
    --member=user:google account \
    --role=roles/artifactregistry.repoAdmin

gcloud projects add-iam-policy-binding sorting-as-a-service \
    --member=user:google account \
    --role=roles/storage.admin

  
### For building and pushing images-
Build — docker build -t saas-image .
  
For running on a local machine the env file needs to be passed as an argument,
  Run — docker run -d -it -p 80:80 --env-file=./server/.env  --name saas-ui saas-image
  
Check image - docker images
  
Check container - docker ps
  
Authenticate gcloud with docker- 
  gcloud auth configure-docker
  
Tag the image with Artifact registry name (format is region-docker.pkg.dev/project-id/artifact-registry-repo/image-name:version)— 
  docker tag saas-image europe-west1-docker.pkg.dev/sorting-as-a-service/sorting-as-a-service-repo/saas-image:v1
  
Push the tagged image — 
  docker push europe-west1-docker.pkg.dev/sorting-as-a-service/sorting-as-a-service-repo/saas-image:v1
  
For Workload identity follow the google dock to create and bind a namespace, service account and kubernetes service account
  https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity
