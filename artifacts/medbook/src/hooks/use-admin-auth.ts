import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("medbook_admin_token"));

  useEffect(() => {
    setToken(localStorage.getItem("medbook_admin_token"));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("medbook_admin_token");
    setToken(null);
    setLocation("/admin/login");
  }, [setLocation]);

  return {
    token,
    isAuthenticated: !!token,
    logout,
    authHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  };
}
