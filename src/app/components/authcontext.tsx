'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  refreshToken: () => Promise<boolean>; // Update the return type to Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/v1/refresh", {
        method: "POST",
        credentials: 'include'
      });
      if (response.ok) {
        // Access token has been refreshed and set in the cookie by the server
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      setIsAuthenticated(false);
      setUser(null);
      return false;
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/v1/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
      } else if (response.status === 401) {
        // Access token expired, try to refresh
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          await checkAuthStatus(); // Retry after refresh
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [refreshToken]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/v1/logout", {
        method: "POST",
        credentials: 'include'
      });
      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error("Logout error:", error);
      // 에러가 발생해도 클라이언트 상태는 로그아웃 처리
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuthStatus, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
