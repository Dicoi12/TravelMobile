import axios from 'axios';

// Android emulator: 10.0.2.2 | iOS simulator: localhost | Physical device: your machine's LAN IP
export const BASE_URL = 'http://10.0.2.2:7100';
export const API_URL = `${BASE_URL}/api`;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
