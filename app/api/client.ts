import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://10.0.2.2:7100/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
