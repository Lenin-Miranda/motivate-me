"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ApiUser,
  type AuthInput,
  type RegisterInput,
  loginRequest,
  registerRequest,
} from "../lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  sessionToken: string | null;
  isReady: boolean;
  login: (input: AuthInput) => Promise<ApiUser>;
  register: (input: RegisterInput) => Promise<ApiUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_STORAGE_KEY = "motivate-me:sessionToken";
const USER_STORAGE_KEY = "motivate-me:user";

function readStoredUser(): ApiUser | null {
  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as ApiUser;
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return readStoredUser();
  });
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  });

  function persistSession(nextUser: ApiUser, nextSessionToken: string) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionToken);
    setUser(nextUser);
    setSessionToken(nextSessionToken);
  }

  function clearSession() {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setSessionToken(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      sessionToken,
      isReady: true,
      async login(input) {
        const response = await loginRequest(input);
        persistSession(response.user, response.sessionToken);
        return response.user;
      },
      async register(input) {
        const response = await registerRequest(input);
        persistSession(response.user, response.sessionToken);
        return response.user;
      },
      logout: clearSession,
    }),
    [sessionToken, user],
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
