'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './authcontext';

const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (window.confirm(`${user?.USER_NAME}님 로그아웃 하시겠습니까?`)) {
      try {
        await logout();
        router.push('/'); // 메인 페이지로 이동
      } catch (error) {
        console.error("Logout error:", error);
        alert('로그아웃 중 오류가 발생했습니다. 다시 시도해 주세요.');
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