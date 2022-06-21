import axios from "axios";
import { BACKEND_IP } from "../constants";

const axiosInstance = axios.create({
  baseURL: `http://${BACKEND_IP}/`,
});
export default axiosInstance;
