import { apiClient } from "./apiClient";

export interface PublicProfile {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  bodyWeightKg: number | null;
  weightClass: string | null;
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const { data } = await apiClient.get<PublicProfile>(`/users/${userId}`);
  return data;
}

export interface UserMention {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
}

export async function searchUsers(query: string): Promise<UserMention[]> {
  const { data } = await apiClient.get<UserMention[]>("/users/search", {
    params: { q: query },
  });
  return data;
}
