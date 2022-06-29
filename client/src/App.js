import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import axiosInstance from "./utils/axios";
import { getCompletionPercentage } from "./utils/utils";
import { v4 as uuidv4 } from 'uuid';
import { BACKEND_IP, RESPONSE_SUCCESS_CODE, HUNDRED_PERCENT} from "./constants";

// upload form submit URL
const backend_lb_action = `http://${BACKEND_IP}/upload_file`;

// Main App functional component
function App() {

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileContent, setFileContent] = useState();
  const [progress, setProgress] = useState();
  const [error, setError] = useState();
  const [fileSelected, setFileSelected] = useState(0); // 0 for file(default) and 1 for input
  const [jobDetails, setJobDetails] = useState({});
  const [pdResult, setPdResult] = useState({
    numberOfPalindromes: null,
    longestPalindromLength: null
  })
  const [jobId, setJobId] = useState();

  // handle submit file
  const submitHandler = async (e) => {
    e.preventDefault(); //prevent the form from submitting
    let formData = new FormData();
    if(fileSelected === 0){
      formData.append("file", selectedFiles[0]);
    } else {
        if(String(fileContent).length === 0){
          setError('Select a file or add text in the textbox');
        }
        else {
          const blob = new Blob([fileContent], {type: 'plain/text'});
          formData.append("file", blob, uuidv4()+".txt")
        }
    }
    //Clear the error message
    setError("");
    const response = await axiosInstance
      .post("/upload_file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (data) => {
          //Set the progress value to show the progress bar
          setProgress(Math.round((100 * data.loaded) / data.total));
        },
      })
      .catch((error) => {
        const { code } = error?.response?.data;
        switch (code) {
          case "FILE_MISSING":
            setError("Please select a file before uploading!");
            break;
          case "LIMIT_FILE_SIZE":
            setError("File size is too large. Please upload files below 1MB!");
            break;
          case "INVALID_TYPE":
            setError(
              "This file type is not supported! Only .txt files are allowed"
            );
            break;

          default:
            setError("Sorry! Something went wrong. Please try again later");
            break;
        }
      });
      if(response && response.status === RESPONSE_SUCCESS_CODE){
        // if file is uploaded successfully, insert a new job record in the jobs table
        const filename = response.data;
        // console.log(formData.get("file"))
        const sqlresponse = await axiosInstance.post(`/create_job/${filename}`)
          .catch((error)=>{
            setError("Error in creating job")
          });
        if(sqlresponse && sqlresponse.data){
          setJobId(sqlresponse.data);
          setProgress(null);
          document.getElementsByName("upload-form")[0].reset();
          setJobDetails({});
          setPdResult({});
          pushAndUpdateChunks(sqlresponse.data, filename, formData);
        }
        
        }
      }
  // Push pubsub messages and upadte chunks in the db
  const pushAndUpdateChunks = async (jobId, filename, formData) =>{
    try {
      const byteRangeResponse = await axiosInstance.post("/get_byte_range", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      }).catch((error)=>{
        setError(error);
      });
      if (byteRangeResponse && byteRangeResponse.data){
        if(byteRangeResponse.data.length>0){
            await axiosInstance.post(`/pubsub/push/${jobId}/${filename}`, byteRangeResponse.data, {
              headers: {
                "Content-Type": "application/json"
              }
            }).catch((error)=>{
              setError(error);
            });
            await axiosInstance.post(`/update_chunks/${jobId}/${byteRangeResponse.data.length}`).catch((error)=>{
              setError(error);
            });  
          }
        }
    } catch (error) {
      setError("Error reaching server");
    }
    
  }
  // handle change in the textbox
  const textBoxChangeHandler = (e) =>{
    if(e.target.value.length> 0) {
      setFileContent(e.target.value);
      setFileSelected(1);
    }
    else {
      setFileSelected(0);
    }
  }

  // fetch job data from the db
  const getJobData = async () => {
    const job_id = String(document.getElementById('jobIdInput').value);
    if(!job_id || !job_id.length>0){
      setError("Please enter an ID");
    }
    else{
      try {
        const response = await axiosInstance.get(`/get_job_details/${job_id}`)
          .catch((error)=>{
            setError(error);
      });
        if(response && response.data && response.data.length>0){
          return response.data[0];
        }
        else {
          return null;
    }
      } catch (error) {
        setError("Error reaching server");
      }
      
    }
    
  }

  // handle get status
  const queryHandler = async (e) => {
    e.preventDefault();
    setError("");
    setJobDetails({});
    setPdResult({});
    const jobData = await getJobData();
    if(jobData) {
      setJobDetails(jobData);
      enableDownload(jobData);
      getPalindromeDetails();
      updateCompletionPerc(jobData);
      updateIsProcessed(jobData);
    } else {
      setJobDetails({data: false});
    }
    
  }
  // enable download if job data available
  const enableDownload = (jobData) => {
    const button = document.getElementById('downloadButton');
    if(jobData){
     button.disabled = false;
    }
    else{
      button.disabled = true;
    }
  }

  // check of unack messages and update completion percentatage
  const updateCompletionPerc = async (jobData) => {
    const currentCompletionPerc = parseInt(jobData.completion_perc);
    if(currentCompletionPerc !== 100 || currentCompletionPerc < 0){
    try {
      const response = await axiosInstance.get(`/pubsub/unack/sorting`)
      .catch((error)=>{
        setError(error);
      });
      if(response && response.data !== ""){
        const noOfUnack = response.data;
        
          const completionPerc = getCompletionPercentage(jobData.chunks, noOfUnack);
          const requestBody = {
            jobId: jobData.job_id,
            completion_perc: completionPerc
          }
          await axiosInstance.put("/update_completion_perc", requestBody)
              .catch((error)=>{
                setError(error);
          });
          const updatedJobDetails = await getJobData();
          if (updatedJobDetails) {
            setJobDetails(updatedJobDetails);
            if(completionPerc === 100 || completionPerc===100.00){
              updateIsProcessed(jobData);
            }
          }
        }
    } catch (error) {
      setError("Error reaching server");
    }
  }
  }

  // update isProcessed status in DB
  const updateIsProcessed = async (jobData) => {
    if(jobData && parseInt(jobData.completion_perc) === HUNDRED_PERCENT) {
      if(!jobData.isProcessed){
        try {
          await axiosInstance.post(`update_is_processed/${jobData.job_id}/${true}`).catch(error=>{
            setError(error);
          });
          const updatedJobDetails = await getJobData();
          if(updatedJobDetails){
            setJobDetails(updatedJobDetails);
          }
        } catch (error) {
            setError("Error reaching server");
        }

      }
    }
  }
  // get unack messages to update palindrome details
  const getPalindromeDetails = async () => {
    try {
      if(pdResult && pdResult.numberOfPalindromes && pdResult.longestPalindromLength){
        return;
      }
      const unackPdMessagesCountResponse = await axiosInstance.get(`/pubsub/unack/palindrome`)
        .catch((error)=>{
          setError(error);
        });
      if (unackPdMessagesCountResponse && unackPdMessagesCountResponse.data === 0) {
        const updatedJobDetails = await getJobData();
        if (updatedJobDetails) {
          setJobDetails(updatedJobDetails);
          if(updatedJobDetails.no_of_pd > 0 && updatedJobDetails.length_of_pd > 0){
            setPdResult({
              numberOfPalindromes: updatedJobDetails.no_of_pd,
              longestPalindromLength: updatedJobDetails.length_of_pd
            });
          } else {
            setPdResult({
              numberOfPalindromes: null,
              longestPalindromLength: null
            });
          }          
        }
      }
    } catch (error) {
        setError("Error reaching server");
    }
      
  }
  // handle download
  const downloadHandler = async (e) => {
    e.preventDefault();
    setError("");
    if(!Object.keys(jobDetails).length > 0){
      const data = await getJobData();
      setJobDetails(data);
    }
    try {
      if(Object.keys(jobDetails).length > 0){
        const response = await axiosInstance.get(`/download/${jobDetails.filename}`)
          .catch((error)=>{
            setError("File missing or could not find", error?.response?.data);
        });
        if(response && response.status === RESPONSE_SUCCESS_CODE && response.data){
          const url = response.data[0];
          const a = document.createElement('a');
          a.href = url;
          a.download = url.split('/').pop();
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          updateIsProcessed(jobDetails);
        } else {
          setError("Processed file not available for this ID, Please check your job ID or try again later");
        }
    } 
    } catch (error) {
      setError("Error downloading file") 
    }

  }
  
  // enable/disable get status button
  const queryTextHandler = (e) => {
    const button = document.getElementById("getStatus");
    if(e.target.value && e.target.value.length>0){
      button.disabled = false;
    }
    else {
      button.disabled = true;
    }
  }

  return (
    <Container>
      <Row>
        <Col lg={{ span: 4, offset: 3 }}>
          <Form
            action={backend_lb_action}
            method="post"
            encType="multipart/form-data"
            onSubmit={submitHandler}
            style={{marginBottom:10}}
            name="upload-form"
          >
            <Form.Label>Welcome to Sorting as a Service App</Form.Label>
            <Form.Group>
              <Form.File
                id="FormControlFile1"
                label="Select a File"
                name="file"
                onChange={(e) => {
                  setSelectedFiles(e.target.files);
                  setFileSelected(0)
                }}
              />
            </Form.Group>
            <Form.Group>
                <Form.Control as={"textarea"} placeholder="or Enter some text" onChange={textBoxChangeHandler}>
                </Form.Control>
            </Form.Group>
            <Form.Group>
              <Button variant="primary" type="submit">
                Upload
              </Button>
              <Form.Text hidden={!jobId}>Your Job ID for submitted file is: {jobId}</Form.Text>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            {!error && progress && (
              <ProgressBar now={progress} label={`${progress}%`} />
            )}
          </Form>
          <Form onSubmit={queryHandler}>
            <Form.Group>
              <Form.Control id="jobIdInput" as={"input"} placeholder="Enter a Job ID" onChange={queryTextHandler}>
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Button id="getStatus" variant="info" type="submit" disabled>
                Get Status
              </Button>
            </Form.Group>
            <Form.Group>
            <Form.Text hidden={Object.keys(jobDetails).length === 0}>
                {Object.keys(jobDetails).length > 0 ?
                jobDetails.isProcessed ? "File processed: Yes" : "File processed: No" :
                ""}</Form.Text>
              <Form.Text hidden={Object.keys(jobDetails).length === 0}>
                {Object.keys(jobDetails).length > 0 && jobDetails.completion_perc ? `File processing status:
              ${jobDetails.completion_perc} %` : ""}</Form.Text>
              <Form.Text hidden={Object.keys(jobDetails).length === 0}>
                {Object.keys(jobDetails).length > 0 && jobDetails.data === false ? "ID not found" : ""} 
                </Form.Text>
              <Form.Text>{Object.keys(jobDetails).length > 0 && jobDetails.completion_perc === 100 ? 
              "File processed, download the sorted file by clicking the button below":""}</Form.Text>
              <Form.Text>{pdResult.longestPalindromLength ?
               `Longest Palindrome length is: ${pdResult.longestPalindromLength}` : ""}</Form.Text>
              <Form.Text>{pdResult.numberOfPalindromes ? `Number of palindromes in file is
               : ${pdResult.numberOfPalindromes}`: ""}</Form.Text>
            </Form.Group>
          </Form>
          <Form onSubmit={downloadHandler}>
          <Form.Group>
              <Button id="downloadButton" variant="secondary" type="submit" name="download"
              disabled>
                Download
              </Button>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default App;