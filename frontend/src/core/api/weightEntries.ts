import { apiClient } from "./apiClient";
import type { SubmissionStatus } from "./prs";

export interface WeightEntry {
  id: string;
  userId: string;
  userFullName: string;
  bodyWeightKg: number;
  photoUrl: string;
  status: SubmissionStatus;
  createdAt: string;
}

export async function submitWeightEntry(
  bodyWeightKg: number,
  photo: File,
): Promise<WeightEntry> {
  const form = new FormData();
  form.append("bodyWeightKg", String(bodyWeightKg));
  form.append("photo", photo);
  const { data } = await apiClient.post<WeightEntry>("/weight-entries", form);
  return data;
}

export async function getMyWeightEntries(): Promise<WeightEntry[]> {
  const { data } = await apiClient.get<WeightEntry[]>("/weight-entries/mine");
  return data;
}

export async function getWeightEntriesByUser(userId: string): Promise<WeightEntry[]> {
  const { data } = await apiClient.get<WeightEntry[]>(`/weight-entries/by-user/${userId}`);
  return data;
}

export async function getPendingWeightEntries(
  status: SubmissionStatus = "pending",
  skip = 0,
  limit = 12,
): Promise<WeightEntry[]> {
  const { data } = await apiClient.get<WeightEntry[]>("/admin/weight-entries", {
    params: { status, skip, limit },
  });
  return data;
}

export async function updateWeightEntryStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<WeightEntry> {
  const { data } = await apiClient.patch<WeightEntry>(
    `/admin/weight-entries/${id}/status`,
    { status },
  );
  return data;
}
