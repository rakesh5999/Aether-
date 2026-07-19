import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

export async function register({ username, email, password }) {
  const response = await api.post("/auth/register", { username, email, password });
  return response.data;
}

export async function login({ email, password }) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/get-me");
  return response.data;
}

export async function logout() {
  const response = await api.post("/auth/logout");
  return response.data;
}