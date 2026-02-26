import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Axios instance configured for the معاً API.
 * Stateless auth — attaches JWT from localStorage on every request.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request Interceptor ─────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Handle 401 — token expired / invalid.
    // Requests can set `_skipAuthRedirect: true` to opt out
    // (e.g. room-join uses 401 for "invalid passcode", not expired JWT).
    if (response?.status === 401 && !error.config?._skipAuthRedirect) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // Only redirect if not already on auth pages
      const isAuthPage = window.location.pathname.startsWith("/auth");
      if (!isAuthPage) {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
