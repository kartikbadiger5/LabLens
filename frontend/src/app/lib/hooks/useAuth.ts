// frontend/src/lib/hooks/useAuth.ts
import { useState } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../api/endpoints';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
      router.push('/dashboard'); // Redirect after login
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await registerUser({ name, email, password });
      // Optionally auto-login after registration:
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  return { user, error, loading, login, register, fetchCurrentUser };
};
