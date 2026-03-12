import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";

export function useAuth() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("medbook_token"));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("medbook_user"));

  const { data: user, isLoading, isFetching, error, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      staleTime: 30_000,
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
      logout();
    }
  }, [error]);

  // isLoading is true while we have a token but haven't confirmed user yet
  const actuallyLoading = !!token && (isLoading || isFetching) && !user;

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
