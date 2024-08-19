'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './authcontext';

const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    setShowModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowModal(false);
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <>
      <button 
        onClick={handleLogout}
        className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        Logout
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{user?.USER_NAME}님 로그아웃 하시겠습니까?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">로그아웃하면 메인 페이지로 이동합니다.</p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={confirmLogout}
                >
                  로그아웃
                </button>
                <button
                  id="cancel-btn"
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;