import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const api = axios.create({ baseURL, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("placeprep_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize to a readable message; components show this, not raw errors.
    const message =
      err?.response?.data?.message ??
      (err?.code === "ECONNABORTED" ? "Request timed out. Is the backend running?" : null) ??
      (err?.message === "Network Error" ? "Cannot reach backend. Check VITE_API_URL / docker." : null) ??
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}
