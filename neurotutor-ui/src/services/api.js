import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Interceptor to add access token to requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            },
            { timeout: 10000 },
          );

          if (response.status === 200) {
            const { access } = response.data;
            Cookies.set("access_token", access);
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          }
        }
      } catch (e) {
        console.error("Token refresh failed:", e);
        // Clear tokens and let AuthContext handle session expiry
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");

        // Trigger session expiry handling
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("sessionExpired"));
        }
      }
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login/", credentials),
  register: (userData) => api.post("/auth/register/", userData),
  logout: () => {
    const refresh = Cookies.get("refresh_token");
    return api.post("/auth/logout/", { refresh_token: refresh });
  },
  getUser: () => api.get("/auth/profile/"),
};

export const questionAPI = {
  submitAnswer: (data) => api.post("/submit-answer/", data),
  // Adaptive: mastery-based next question (use this as primary)
  getAdaptiveQuestion: (concept) =>
    api.get("/mastery/next-question/", { params: concept ? { concept } : {} }),
  // Fallback when adaptive returns no question (e.g. all mastered)
  getRandomQuestion: (concept) =>
    api.get("/question/random/", { params: concept ? { concept } : {} }),
  getQuestionById: (questionId) => api.get(`/question/id/${questionId}/`),
  getHint: (questionId) => api.get(`/question/hint/?question_id=${questionId}`),
  getExplanation: (questionId) =>
    api.get(`/question/explanation/?question_id=${questionId}`),
  markForReview: (questionId) => api.post("/question/mark-review/", { question_id: questionId }),
  rateReviewQuality: (questionId, quality) => api.post("/question/rate-review/", { question_id: questionId, quality }),
  skipQuestion: (questionId) => api.post("/question/skip/", { question_id: questionId }),
  getManualReviews: () => api.get("/user/manual-reviews/"),
  getMasterySummary: () => api.get("/mastery/summary/"),
  getReviewQueue: () => api.get("/review/queue/"),
  getReviewStats: () => api.get("/review/stats/"),
  getHeatmapData: () => api.get("/gamification/heatmap/"),
  getLeaderboard: () => api.get("/gamification/leaderboard/"),
  getUserStats: () => api.get("/gamification/me/"),
  // Phase 8 – concept map for a given concept
  getConceptMap: (concept) => api.get("/concept/map/", { params: { concept } }),
  // Generic get method for course materials and other endpoints
  get: (url) => api.get(url),
};

export default api;
