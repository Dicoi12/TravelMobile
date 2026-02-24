import { apiClient } from "./client";

// request/response interfaces
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  // add other fields returned by your API if needed
}

/**
 * POST /api/user/login
 * body: { userName, password }
 */
export async function login(body: LoginRequest) {
  return await apiClient.post<LoginResponse>("/user/login", body);
}
