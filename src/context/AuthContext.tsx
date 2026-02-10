import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  loginRequest,
  registerRequest,
  fetchCurrentUser,
  type LoginPayload,
  type RegisterPayload,
  type User,
  clearStoredAuth,
  loadStoredAuth,
  storeAuth,
} from "@/services/api";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    setAccessToken(stored.access);

    fetchCurrentUser(stored.access)
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        clearStoredAuth();
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const auth = await loginRequest(payload);
    storeAuth(auth);
    setAccessToken(auth.access);
    const u = await fetchCurrentUser(auth.access);
    setUser(u);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const auth = await registerRequest(payload);
    if (!auth?.access || !auth?.refresh) {
      throw new Error("Registration did not return valid tokens.");
    }

    try {
      const u = await fetchCurrentUser(auth.access);
      storeAuth(auth);
      setAccessToken(auth.access);
      setUser(u);
    } catch (err) {
      clearStoredAuth();
      setUser(null);
      setAccessToken(null);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, accessToken, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

