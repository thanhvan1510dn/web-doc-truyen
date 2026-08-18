import { AdminUser, AuthState, LoginCredentials } from "../types/auth";
import { ApiResponse } from "../types/api";
import { authService } from "../services/authService";

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AdminUser>> {
    return authService.login(credentials);
  },

  logout(): void {
    authService.logout();
  },

  isAuthenticated(): boolean {
    return authService.isAuthenticated();
  },

  getCurrentUser(): AdminUser | null {
    return authService.getCurrentUser();
  },

  getAuthState(): AuthState {
    return authService.getAuthState();
  },

  subscribe(listener: (state: AuthState) => void): () => void {
    return authService.subscribe(listener);
  },
};
