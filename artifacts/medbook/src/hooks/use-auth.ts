import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";

export function useAuth() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("medbook_token"));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("medbook_user"));

  const { data: user, isLoading, isFetching, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: 2,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any
  });

  const login = (newToken: string, newRole: string) => {
    localStorage.setItem("medbook_token", newToken);
    localStorage.setItem("medbook_user", newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem("medbook_token");
    localStorage.removeItem("medbook_user");
    setToken(null);
    setRole(null);
    setLocation("/");
  };

  useEffect(() => {
    if (error && token) {
      const status = (error as any)?.status;
      if (status === 401) {
        logout();
      }
    }
  }, [error]);

  const actuallyLoading = !!token && isLoading && !user;

  return {
    user,
    token,
    role,
    isLoading: actuallyLoading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };
}
