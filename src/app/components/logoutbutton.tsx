'use client';

import React from 'react';
import { useAuth } from './authcontext';

const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm(`${user?.USER_NAME}님 로그아웃 하시겠습니까?`)) {
      try {
        const response = await fetch("http://localhost:3001/api/v1/logout", {
          method: "POST",
          credentials: 'include'
        });

        if (response.ok) {
          logout(); // AuthContext의 logout 함수 호출
        } else {
          console.error("Logout failed");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
    >
      Logout
    </button>
  );
};

export default LogoutButton;