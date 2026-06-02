"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ApiUser,
  type AuthInput,
  type RegisterInput,
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  isReady: boolean;
  login: (input: AuthInput) => Promise<ApiUser>;
  register: (input: RegisterInput) => Promise<ApiUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  function persistSession(nextUser: ApiUser) {
    setUser(nextUser);
  }

  async function clearSession() {
    await logoutRequest();
    setUser(null);
  }

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      try {
        const { user: currentUser } = await getCurrentUserRequest();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void hydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      async login(input) {
        const response = await loginRequest(input);
        persistSession(response.user);
        return response.user;
      },
      async register(input) {
        const response = await registerRequest(input);
        persistSession(response.user);
        return response.user;
      },
      logout: clearSession,
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
