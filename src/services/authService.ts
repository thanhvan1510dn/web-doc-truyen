import { AdminUser, AuthState, LoginCredentials } from "../types/auth";
import { ApiResponse } from "../types/api";

const AUTH_STORAGE_KEY = "web_doc_truyen_admin_auth_v1";

// Duy nhat 1 Super Admin chu so huu
const SUPER_ADMIN_ACCOUNT: { password: string; user: AdminUser } = {
  password: "admin123",
  user: {
    id: "usr_superadmin_master",
    username: "admin",
    name: "Super Admin (Chủ sở hữu)",
    email: "admin@truyen.vn",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    role: "superadmin",
  },
};

class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    this.loadInitialState();
  }

  private loadInitialState(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.user) {
          this.state = {
            isAuthenticated: true,
            user: parsed.user,
            token: parsed.token,
          };
        }
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    }
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("Auth listener error", err);
      }
    });
  }

  public getAuthState(): AuthState {
    return this.state;
  }

  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  public getCurrentUser(): AdminUser | null {
    return this.state.user;
  }

  public async login(credentials: LoginCredentials): Promise<ApiResponse<AdminUser>> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const username = credentials.username.trim().toLowerCase();

    if (username !== SUPER_ADMIN_ACCOUNT.user.username) {
      return {
        success: false,
        data: null as any,
        error: "Tài khoản không tồn tại. Chỉ duy nhất Super Admin có quyền truy cập.",
      };
    }

    if (credentials.password !== SUPER_ADMIN_ACCOUNT.password) {
      return {
        success: false,
        data: null as any,
        error: "Mật khẩu Super Admin không chính xác.",
      };
    }

    const userWithLogin: AdminUser = {
      ...SUPER_ADMIN_ACCOUNT.user,
      lastLogin: new Date().toISOString(),
    };

    const token = "token_superadmin_" + Date.now();

    this.state = {
      isAuthenticated: true,
      user: userWithLogin,
      token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ token, user: userWithLogin })
      );
    }

    this.notify();

    return {
      success: true,
      data: userWithLogin,
      message: "Chào mừng Super Admin đã đăng nhập!",
    };
  }

  public logout(): void {
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    this.notify();
  }
}

export const authService = new AuthService();
