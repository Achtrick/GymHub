import { createContext } from "react";

export type Role = "user" | "admin";
export type Sex = "male" | "female";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  sex: Sex | null;
  role: Role;
  dateOfBirth: string | null;
  heightCm: number | null;
  bodyWeightKg: number | null;
  age: number | null;
  weightClass: string | null;
  profilePictureUrl: string | null;
  hasPassword: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  sex: Sex;
}

export interface UpdateProfilePayload {
  dateOfBirth: string | null;
  heightCm: number | null;
  sex: Sex;
}

export interface UpdateProfileInfoPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  // Registering an email/password account no longer signs you in — the
  // account needs email activation first.
  register: (payload: RegisterPayload) => Promise<void>;
  activate: (token: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateProfileInfo: (payload: UpdateProfileInfoPayload) => Promise<void>;
  updateProfilePicture: (photo: File) => Promise<void>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
