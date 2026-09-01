import type { AuthUser } from "../auth/auth-context";
import { apiClient } from "./apiClient";

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, newPassword });
}

export async function resendActivation(email: string): Promise<void> {
  await apiClient.post("/auth/resend-activation", { email });
}

export interface ActivateResponse {
  token: string;
  user: AuthUser;
}

export async function activateAccount(token: string): Promise<ActivateResponse> {
  const { data } = await apiClient.post<ActivateResponse>("/auth/activate", { token });
  return data;
}
