'use client';

import { useAuth } from './components/authcontext';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [isAuthenticated, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isAuthenticated ? (
        <p>Welcome {user?.USER_NAME}</p>
      ) : (
        <p>You are not logged in</p>
      )}
    </main>
  );
}
