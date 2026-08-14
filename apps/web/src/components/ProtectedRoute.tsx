import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchProfile, getStoredUser, type CurrentUser } from '../services/auth';

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Array<CurrentUser['role']> }) {
  const token = localStorage.getItem('access_token');
  const [user, setUser] = useState<CurrentUser | null>(getStoredUser());
  const [loading, setLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    if (!token || user) return;
    fetchProfile().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, [token, user]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div className="p-8 text-slate-500">Carregando sua conta...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
