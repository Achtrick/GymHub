import axios from "axios";

export const TOKEN_STORAGE_KEY = "gymhub.auth.token";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const apiClient = axios.create({
  baseURL: API_URL,
});

export function mediaUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// SESSION_EXPIRED_EVENT fires on any 401 from a request that carried a
// token — i.e. the token itself was rejected (expired/invalid), not a
// login/register attempt with bad credentials (those requests carry no
// Authorization header yet). AuthProvider listens for this to force a
// logout and show a message, since it's the one place with access to
// both the auth state and the router.
export const SESSION_EXPIRED_EVENT = "gymhub:session-expired";

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);
