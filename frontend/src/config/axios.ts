import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10s timeout
  withCredentials: true,
})

// Request Interceptor: No-op since tokens are in HTTP-only cookies
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response) {
      // 401 Unauthorized: Try to refresh the token
      if (
        error.response.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/auth/refresh")
      ) {
        originalRequest._retry = true
        try {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )

          if (refreshResponse.data?.status === "success") {
            // Retry original request. The cookies set on refresh are automatically attached.
            return api(originalRequest)
          }
        } catch (refreshError) {
          // If refresh fails, clear user state and redirect to login
          localStorage.removeItem("auth_user")

          if (!window.location.pathname.includes("/login")) {
            window.location.href = `/login?redirect=${encodeURIComponent(
              window.location.pathname
            )}`
          }
          return Promise.reject(refreshError)
        }
      }

      // If it is a 401 on the refresh request or we've already retried, clear user state and redirect
      if (error.response.status === 401) {
        localStorage.removeItem("auth_user")

        if (!window.location.pathname.includes("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.pathname
          )}`
        }
      }

      // Extract backend error message if available
      const message = error.response.data?.message || "An unexpected error occurred"
      return Promise.reject(new Error(message))
    }
    
    if (error.request) {
      // Request was made but no response was received
      return Promise.reject(new Error("No response received from operations server"))
    }
    
    return Promise.reject(error)
  }
)

export default api
