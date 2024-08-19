'use client';

import { useAuth } from './components/authcontext';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, user, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthStatus = async () => {
      if (!isAuthenticated && !user) {
        await checkAuthStatus();
      }
      setLoading(false);
    };
    loadAuthStatus();
  }, [isAuthenticated, user, checkAuthStatus]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isAuthenticated && user ? (
        <p>Welcome {user.USER_NAME}</p>
      ) : (
        <p>You are not logged in</p>
      )}
    </main>
  );
}