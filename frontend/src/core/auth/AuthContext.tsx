import axios from "axios";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, SESSION_EXPIRED_EVENT, TOKEN_STORAGE_KEY } from "../api/apiClient";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type RegisterPayload,
  type UpdateProfileInfoPayload,
  type UpdateProfilePayload,
} from "./auth-context";

const USER_STORAGE_KEY = "gymhub.auth.user";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function persistSession(response: AuthResponse) {
  localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const navigate = useNavigate();

  // A request came back 401 with a token attached — the token itself was
  // rejected (expired or otherwise invalid). Force a logout and explain why,
  // rather than leaving the user stuck on a screen that silently stops working.
  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setUser(null);
      navigate("/login", {
        replace: true,
        state: { message: "Your session has expired. Please log in again." },
      });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        try {
          const { data } = await apiClient.post<AuthResponse>("/auth/login", {
            email,
            password,
          });
          persistSession(data);
          setUser(data.user);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Invalid email or password."),
            { cause: error },
          );
        }
      },
      register: async (payload: RegisterPayload) => {
        try {
          // Registering only creates the account and sends an activation
          // email — it does not sign the user in.
          await apiClient.post("/auth/register", payload);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Could not create your account."),
            { cause: error },
          );
        }
      },
      activate: async (token: string) => {
        try {
          const { data } = await apiClient.post<AuthResponse>("/auth/activate", { token });
          persistSession(data);
          setUser(data.user);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "This activation link is invalid or has expired."),
            { cause: error },
          );
        }
      },
      loginWithGoogle: async (idToken) => {
        try {
          const { data } = await apiClient.post<AuthResponse>("/auth/google", {
            idToken,
          });
          persistSession(data);
          setUser(data.user);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Google sign-in failed."),
            { cause: error },
          );
        }
      },
      updateProfile: async (payload: UpdateProfilePayload) => {
        try {
          const { data } = await apiClient.patch<AuthUser>("/users/me", payload);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
          setUser(data);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Could not update your profile."),
            { cause: error },
          );
        }
      },
      updateProfileInfo: async (payload: UpdateProfileInfoPayload) => {
        try {
          const { data } = await apiClient.patch<AuthUser>("/users/me/info", payload);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
          setUser(data);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Could not update your details."),
            { cause: error },
          );
        }
      },
      updateProfilePicture: async (photo: File) => {
        try {
          const form = new FormData();
          form.append("photo", photo);
          const { data } = await apiClient.post<AuthUser>("/users/me/photo", form);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
          setUser(data);
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Could not upload your photo."),
            { cause: error },
          );
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        try {
          await apiClient.post("/users/me/password", { currentPassword, newPassword });
          setUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, hasPassword: true };
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        } catch (error) {
          throw new Error(
            extractErrorMessage(error, "Could not change your password."),
            { cause: error },
          );
        }
      },
      logout: () => {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
