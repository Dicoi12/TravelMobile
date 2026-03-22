import { apiClient } from './client';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface SignUpRequest {
  userName: string;
  password: string;
  email: string;
  phone?: string;
}

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/user/Login', body),

  signUp: (body: SignUpRequest) =>
    apiClient.post<{ isSuccessful: boolean; result: boolean; validationMessage: string | null }>(
      '/user/SignUp',
      body,
    ),

  changePassword: (body: { userId: number; oldPassword: string; newPassword: string }) =>
    apiClient.post('/user/ChangePassword', body),
};

// legacy export
export async function login(body: LoginRequest) {
  return apiClient.post<LoginResponse>('/user/Login', body);
}
