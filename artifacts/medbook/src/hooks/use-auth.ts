import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";

export function useAuth() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("medbook_token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("medbook_user"));

  // Try to fetch user info if we have a token
  const { data: user, isLoading, error, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false
    }
  });

  // Keep localStorage in sync
  const login = (newToken: string, newRole: string) => {
    localStorage.setItem("medbook_token", newToken);
    localStorage.setItem("medbook_user", newRole);
    setToken(newToken);
    setRole(newRole);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("medbook_token");
    localStorage.removeItem("medbook_user");
    setToken(null);
    setRole(null);
    setLocation("/");
  };

  // If token is invalid, auto logout
  useEffect(() => {
    if (error && token) {
      logout();
    }
  }, [error, token]);

  return {
    user,
    token,
    role,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!token
  };
}
