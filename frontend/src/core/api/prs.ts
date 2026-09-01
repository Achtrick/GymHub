import { apiClient } from "./apiClient";

export type LiftType = "squat" | "bench" | "deadlift";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface PrSubmission {
  id: string;
  userId: string;
  userFullName: string;
  userProfilePictureUrl: string | null;
  liftType: LiftType;
  weightKg: number;
  videoUrl: string;
  status: SubmissionStatus;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

export interface Comment {
  id: string;
  userId: string;
  userFullName: string;
  text: string;
  createdAt: string;
  parentCommentId: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  profilePictureUrl: string | null;
  sex: string | null;
  age: number | null;
  bodyWeightKg: number | null;
  weightClass: string | null;
  heightCm: number | null;
  squatKg: number;
  benchKg: number;
  deadliftKg: number;
  totalKg: number;
}

export async function getFeed(skip = 0, limit = 12): Promise<PrSubmission[]> {
  const { data } = await apiClient.get<PrSubmission[]>("/prs/feed", {
    params: { skip, limit },
  });
  return data;
}

export async function getMyPrs(skip = 0, limit = 12): Promise<PrSubmission[]> {
  const { data } = await apiClient.get<PrSubmission[]>("/prs/mine", {
    params: { skip, limit },
  });
  return data;
}

export async function getPrsByUser(userId: string): Promise<PrSubmission[]> {
  const { data } = await apiClient.get<PrSubmission[]>(`/prs/by-user/${userId}`);
  return data;
}

export async function getPrById(id: string): Promise<PrSubmission> {
  const { data } = await apiClient.get<PrSubmission>(`/prs/${id}`);
  return data;
}

export async function submitPr(
  liftType: LiftType,
  weightKg: number,
  video: File,
): Promise<PrSubmission> {
  const form = new FormData();
  form.append("liftType", liftType);
  form.append("weightKg", String(weightKg));
  form.append("video", video);
  const { data } = await apiClient.post<PrSubmission>("/prs", form);
  return data;
}

export async function toggleLike(
  id: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data } = await apiClient.post<{ liked: boolean; likeCount: number }>(
    `/prs/${id}/like`,
  );
  return data;
}

// Paginated by root comment — a page also includes every reply under the
// root comments it returns. Count roots (comments with no parentCommentId)
// in the response to know whether another page remains.
export async function getComments(id: string, skip = 0, limit = 12): Promise<Comment[]> {
  const { data } = await apiClient.get<Comment[]>(`/prs/${id}/comments`, {
    params: { skip, limit },
  });
  return data;
}

export async function locateComment(
  id: string,
  commentId: string,
): Promise<{ rootCommentId: string; position: number }> {
  const { data } = await apiClient.get<{ rootCommentId: string; position: number }>(
    `/prs/${id}/comments/${commentId}/locate`,
  );
  return data;
}

export async function addComment(
  id: string,
  text: string,
  parentCommentId?: string,
): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(`/prs/${id}/comments`, {
    text,
    parentCommentId,
  });
  return data;
}

export async function deleteComment(id: string, commentId: string): Promise<string[]> {
  const { data } = await apiClient.delete<{ deletedCommentIds: string[] }>(
    `/prs/${id}/comments/${commentId}`,
  );
  return data.deletedCommentIds;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntry[]>("/leaderboard");
  return data;
}

export async function getPendingSubmissions(
  status: SubmissionStatus = "pending",
  skip = 0,
  limit = 12,
): Promise<PrSubmission[]> {
  const { data } = await apiClient.get<PrSubmission[]>("/admin/prs", {
    params: { status, skip, limit },
  });
  return data;
}

export async function updateSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<PrSubmission> {
  const { data } = await apiClient.patch<PrSubmission>(
    `/admin/prs/${id}/status`,
    { status },
  );
  return data;
}
