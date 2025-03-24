'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/navbar/NavBar';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch user details');
        }

        const userData: UserProfile = await res.json();
        if (userData) {
          const avatarUrl = generateAvatarUrl(userData.username);
          setUser({ ...userData, avatarUrl });
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const generateAvatarUrl = (username: string): string => {
    // Simulate Gemini model by generating a unique cartoon avatar using DiceBear API
    return `https://avatars.dicebear.com/api/avataaars/${encodeURIComponent(username)}.svg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <NavBar />
      <div className="flex-grow container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-lg mx-auto">
          <div className="flex flex-col items-center">
            <img
              src={user.avatarUrl}
              alt="Profile Avatar"
              className="w-32 h-32 rounded-full shadow-md mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>LABLENS @2025</p>
          <p className="text-gray-400 mt-1">
            AI-powered insights for your health data.
          </p>
        </div>
      </footer>
    </div>
  );
}