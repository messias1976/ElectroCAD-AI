import { NavLink, useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../../services/auth';

export default function Header() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearStoredUser();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm print:hidden">
      <div>
        <h1 className="text-xl font-bold text-blue-700">⚡ ElectroCAD AI</h1>
        <p className="text-sm text-gray-500">{isAdmin ? 'Administração SaaS' : 'Área do assinante'}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-sm text-slate-500">{user?.username}</span>
        <NavLink to="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">Dashboard</NavLink>
        <button onClick={handleLogout} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">Sair</button>
      </div>
    </header>
  );
}
