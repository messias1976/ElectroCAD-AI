import { NavLink } from 'react-router-dom';
import { House, CreditCard, Users, TrendingUp, CircuitBoard, PenTool, Bot, Settings, FolderKanban } from 'lucide-react';
import { getStoredUser } from '../../services/auth';

const common = [
  { label: 'Dashboard', icon: House, path: '/dashboard' },
  { label: 'Meus clientes', icon: Users, path: '/clients' },
  { label: 'Meus projetos', icon: FolderKanban, path: '/projects' },
  { label: 'Planta elétrica', icon: PenTool, path: '/planta' },
  { label: 'Projetista', icon: CircuitBoard, path: '/projetista' },
  { label: 'Professor IA', icon: Bot, path: '/professor' },
];

const admin = [
  { label: 'Assinantes', icon: Users, path: '/dashboard' },
  { label: 'Assinaturas e planos', icon: CreditCard, path: '/subscriptions' },
  { label: 'Configurações IA', icon: Settings, path: '/configuracoes-ia' },
  { label: 'Métricas SaaS', icon: TrendingUp, path: '/metrics' },
];

export default function Sidebar() {
  const user = getStoredUser();
  const menu = user?.role === 'ADMIN' ? [...common, ...admin] : common;

  return (
    <aside className="app-sidebar w-72 bg-slate-900 text-white flex flex-col print:hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl font-bold">⚡ ElectroCAD AI</div>
        <div className="mt-1 text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Administrador SaaS' : 'Assinante'}</div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 transition ${isActive ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
