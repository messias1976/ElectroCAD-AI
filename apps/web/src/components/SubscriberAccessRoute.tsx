import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { getStoredUser } from '../services/auth';

export default function SubscriberAccessRoute({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!user || user.role === 'ADMIN') { setLoading(false); return; }
    apiFetch('/subscriptions/me')
      .then((access) => setAllowed(Boolean(access.accessAllowed)))
      .catch(() => setAllowed(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-slate-500">Verificando acesso da assinatura...</div>;
  if (!allowed) return <Navigate to="/assinar" replace />;
  return <>{children}</>;
}
