'use client';

import { useAuth } from './components/authcontext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

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
