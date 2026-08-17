import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { getStoredUser } from '../services/auth';

const ACCESS_CACHE_KEY = 'electrocad-access-cache';
const ACCESS_CACHE_TTL = 60_000;

type AccessCache = { allowed: boolean; expiresAt: number };

function readCachedAccess(): boolean | null {
  try {
    const raw = localStorage.getItem(ACCESS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as AccessCache;
    if (cached.expiresAt > Date.now()) return cached.allowed;
    localStorage.removeItem(ACCESS_CACHE_KEY);
  } catch {
    localStorage.removeItem(ACCESS_CACHE_KEY);
  }
  return null;
}

function saveCachedAccess(allowed: boolean) {
  localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify({ allowed, expiresAt: Date.now() + ACCESS_CACHE_TTL }));
}

export default function SubscriberAccessRoute({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  const cached = user?.role === 'ADMIN' ? true : readCachedAccess();
  const [loading, setLoading] = useState(cached === null);
  const [allowed, setAllowed] = useState(cached ?? true);

  useEffect(() => {
    if (!user || user.role === 'ADMIN' || cached !== null) {
      setLoading(false);
      return;
    }
    let active = true;
    apiFetch('/subscriptions/me')
      .then((access) => {
        if (!active) return;
        const next = Boolean(access?.accessAllowed);
        setAllowed(next);
        saveCachedAccess(next);
      })
      .catch(() => {
        if (active) setAllowed(true);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <div className="p-8 text-sm text-slate-500">Verificando acesso da assinatura...</div>;
  if (!allowed) return <Navigate to="/assinar" replace />;
  return <>{children}</>;
}
