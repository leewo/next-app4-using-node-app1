'use client';

import { useAuth } from './components/authcontext';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, user, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthStatus = async () => {
      await checkAuthStatus();
      setLoading(false);
    };
    loadAuthStatus();
  }, [checkAuthStatus]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        {isAuthenticated ? (
          <p className="text-2xl font-bold text-gray-800">Welcome {user?.USER_NAME}</p>
        ) : (
          <p className="text-2xl font-bold text-gray-800">You are not logged in</p>
        )}
      </div>
    </main>
  );
}