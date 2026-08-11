import { http } from '../http';
import type { LoginResponse, User } from '../../types';

export const authApi = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>('/auth/login', { email, password }, { isAuthAttempt: true }),
  getMe: () => http.get<User>('/auth/me'),
};
