import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "http://backend:8081/",
});
export default axiosInstance;
