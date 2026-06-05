import React, { createContext, useState, useEffect, useContext } from "react";
import Cookies from "js-cookie";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get("access_token");
      if (token) {
        try {
          const response = await authAPI.getUser();
          setUser(response.data);
        } catch (error) {
          console.error("Failed to fetch user", error);
          // Check if it's a token expiry error
          if (
            error.response?.status === 401 ||
            error.response?.data?.code === "token_not_valid"
          ) {
            setSessionExpired(true);
          }
          logout(false); // Don't redirect, just clear tokens
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, tokens } = response.data;
      Cookies.set("access_token", tokens.access);
      Cookies.set("refresh_token", tokens.refresh);
      setUser(user);
      setSessionExpired(false);
      return user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user, tokens } = response.data;
      Cookies.set("access_token", tokens.access);
      Cookies.set("refresh_token", tokens.refresh);
      setUser(user);
      setSessionExpired(false);
      return user;
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const logout = async (redirect = true) => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      setUser(null);
      if (redirect) {
        window.location.href = "/login";
      }
    }
  };

  const handleSessionExpired = () => {
    setSessionExpired(true);
    logout(false); // Clear tokens but don't redirect
  };

  const renewSession = async () => {
    try {
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        const response = await authAPI.login({ refresh_token: refreshToken });
        const { user, tokens } = response.data;
        Cookies.set("access_token", tokens.access);
        Cookies.set("refresh_token", tokens.refresh);
        setUser(user);
        setSessionExpired(false);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed", error);
    }
    return false;
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    sessionExpired,
    handleSessionExpired,
    renewSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
