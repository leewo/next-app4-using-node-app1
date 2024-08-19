'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/authcontext';

export default function MyPage() {
  const { user, checkAuthStatus } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.USER_NAME || '');
      setEmail(user.USER_ID || '');
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/v1/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage(data.message || 'Failed to change password');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: { name?: string; email?: string } = {};
      if (name !== user?.USER_NAME) updateData.name = name;
      if (email !== user?.USER_ID) updateData.email = email;

      if (Object.keys(updateData).length === 0) {
        setMessage('No changes to update');
        return;
      }

      const response = await fetch('http://localhost:3001/api/v1/update-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('User information updated successfully');
        checkAuthStatus(); // 사용자 정보 재로드
      } else {
        setMessage(data.message || 'Failed to update user information');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Page</h1>
      {message && <p className="mb-4 text-green-500">{message}</p>}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block mb-1">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-1">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Change Password
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Update User Information</h2>
        <form onSubmit={handleInfoUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Update Information
          </button>
        </form>
      </div>
    </div>
  );
}
