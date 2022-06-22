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
import { getChunks } from "./utils/fileUtils";
import { v4 as uuidv4 } from 'uuid';
import { BACKEND_IP } from "./constants";

const backend_lb_action = `http://${BACKEND_IP}/upload_file`;

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileContent, setFileContent] = useState();
  const [progress, setProgress] = useState();
  const [error, setError] = useState();
  const [fileSelected, setFileSelected] = useState(0); // 0 for file(default) and 1 for input
  const [jobDetails, setJobDetails] = useState({});
  const [jobId, setJobId] = useState();
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
      if(response.status === 200){
        // if file is uploaded successfully, insert a new job record in the jobs table
        const filename = response.data;
        // console.log(formData.get("file"))
        const chunks = getChunks(formData.get("file"));
        const sqlresponse = await axiosInstance.post(`/create_job/${filename}/${chunks.length}`);
        setJobId(sqlresponse.data);
        document.getElementsByName("upload-form")[0].reset();
        setProgress(null);
        axiosInstance.post(`/pubsub/push/${filename}`, chunks, {
          headers: {
            "Content-Type": "application/json"
          }
        }).catch((error)=>{
          setError(error);
        });
      }
    }
  
  const textBoxChangeHandler = (e) =>{
    if(e.target.value.length> 0) {
      setFileContent(e.target.value);
      setFileSelected(1);
    }
    else {
      setFileSelected(0);
    }
  }

  const queryHandler = async (e) => {
    e.preventDefault();
    setError("");
    const job_id = String(document.getElementById('jobIdInput').value);
    const response = await axiosInstance.get(`/get_job_details/${job_id}`)
    .catch((error)=>{
      setError(error);
    });
    response.data.length > 0 ? setJobDetails(response.data[0]) : setJobDetails({data: false});
  }

  const downloadHandler = async (e) => {
    e.preventDefault();
    const response = await axiosInstance.get(`/download/${jobDetails.filename}`).catch((error)=>{
      setError(error);
    })
    const url = response.data[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              <Form.Text hidden={!jobId}>Your token for submitted file is: {jobId}</Form.Text>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            {!error && progress && (
              <ProgressBar now={progress} label={`${progress}%`} />
            )}
          </Form>
          <Form
            onSubmit={queryHandler}
            >
            <Form.Group>
              <Form.Control id="jobIdInput" as={"input"} placeholder="Enter a job id">
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Button variant="info" type="submit">
                Get Status
              </Button>
            </Form.Group>
            <Form.Group>
              <Form.Text hidden={Object.keys(jobDetails).length === 0}>
                {Object.keys(jobDetails).length > 0 && jobDetails.completion_perc ? `File processing status:
              ${jobDetails.completion_perc} %` : ""}</Form.Text>
              <Form.Text hidden={Object.keys(jobDetails).length === 0}>
                {Object.keys(jobDetails).length > 0 && jobDetails.data === false ? "ID not found" : ""} 
                </Form.Text>
              <Form.Text>{Object.keys(jobDetails).length > 0 && jobDetails.completion_perc === 100 ? 
              "Download processed file by clicking the button below":""}</Form.Text>
            </Form.Group>
            <Form.Group>
              <Button variant="secondary" type="submit" name="download"
              disabled={!jobDetails.completion_perc || jobDetails.completion_perc < 100}
              onClick={downloadHandler}>
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
