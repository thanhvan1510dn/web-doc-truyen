export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  role: "superadmin";
  lastLogin?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  token: string | null;
}
