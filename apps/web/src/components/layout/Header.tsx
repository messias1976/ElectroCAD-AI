import { Menu } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../../services/auth';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header relative z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b bg-white px-3 py-2 shadow-sm print:hidden sm:px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Abrir barra lateral"
          title="Abrir menu"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-blue-700 sm:text-xl">⚡ ElectroCAD AI</h1>
          <p className="hidden truncate text-xs text-gray-500 sm:block sm:text-sm">
            {isAdmin ? 'Administração SaaS' : 'Área do assinante'}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="hidden max-w-40 truncate text-sm text-slate-500 lg:inline" title={user?.username}>
          {user?.username}
        </span>
        <NavLink
          to="/dashboard"
          className="hidden rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
        >
          Dashboard
        </NavLink>
        <button
          onClick={handleLogout}
          className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 sm:px-4 sm:text-sm"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
