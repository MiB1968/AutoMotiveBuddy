import axios from "axios";

// This points to our backend API (which could be the same Vite dev server if running fullstack)
const api = axios.create({
  baseURL: "/api" // changed from http://localhost:8000 to /api for fullstack Express+Vite setup
});

export default api;
