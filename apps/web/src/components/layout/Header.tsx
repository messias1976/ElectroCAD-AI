import { NavLink, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { clearStoredUser, getStoredUser } from '../../services/auth';

type Props = { onOpenMenu: () => void };

export default function Header({ onOpenMenu }: Props) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header flex min-h-16 items-center justify-between gap-3 border-b bg-white px-3 py-2 shadow-sm sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenMenu} className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50" aria-label="Abrir menu">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-blue-700 sm:text-xl">⚡ ElectroCAD AI</h1>
          <p className="truncate text-xs text-gray-500 sm:text-sm">{isAdmin ? 'Administração SaaS' : 'Área do assinante'}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-40 truncate text-sm text-slate-500 lg:inline">{user?.username}</span>
        <NavLink to="/dashboard" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 sm:inline-flex">Dashboard</NavLink>
        <button onClick={handleLogout} className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 sm:px-4 sm:text-sm">Sair</button>
      </div>
    </header>
  );
}
