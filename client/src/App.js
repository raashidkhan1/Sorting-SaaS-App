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

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileContent, setFileContent] = useState();
  const [progress, setProgress] = useState();
  const [error, setError] = useState();
  const [fileSelected, setFileSelected] = useState([0]); // 0 for file(default) and 1 for input
  const [jobDetails, setJobDetails] = useState({});
  let jobId;
  const submitHandler = (e) => {
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
          formData.append("file", blob)
        }
    }
    //Clear the error message
    setError("");
    const response = axiosInstance
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
      response.then((res)=>{
        if(res.status === 200){
          const filename = res.data;
          const sqlresponse = axiosInstance.post(`/create_job/${filename}`);
          console.log(sqlresponse)
        }
      })
    } 

  const queryHandler = (e) => {
    e.preventDefault();
    setError("");
    const job_id = String(document.getElementById('jobIdInput').value);
    const response = axiosInstance.get(`/get_job_details/${job_id}`)
    .catch((error)=>{
      setError(error);
    });
    setJobDetails(response);
  }

  return (
    <Container>
      <Row>
        <Col lg={{ span: 4, offset: 3 }}>
          <Form
            action="http://localhost:8081/upload_file"
            method="post"
            encType="multipart/form-data"
            onSubmit={submitHandler}
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
                <Form.Control as={"textarea"} placeholder="or Enter some text" onChange={(e)=> {
                  setFileContent(e.target.value);
                  setFileSelected(1);
                }}></Form.Control>
            </Form.Group>
            <Form.Group>
              <Button variant="info" type="submit">
                Upload
              </Button>
              <Form.Text hidden={!jobId}>Your Job ID is {jobId}</Form.Text>
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
              <Form.Text>{Object.keys(jobDetails).length > 0 ? `Your job completion percent is 
              ${jobDetails.completion_perc}` : ""}</Form.Text>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
