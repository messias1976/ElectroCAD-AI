import { NavLink } from 'react-router-dom';
import { House, CreditCard, Users, TrendingUp, CircuitBoard, PenTool, Bot, Settings, FolderKanban, X } from 'lucide-react';
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

type SidebarProps = { open?: boolean; onClose?: () => void };

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const user = getStoredUser();
  const menu = user?.role === 'ADMIN' ? [...common, ...admin] : common;

  return (
    <>
      {open && <button aria-label="Fechar menu" className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="flex items-center justify-between border-b border-slate-700 p-5 sm:p-6">
          <div>
            <div className="text-xl font-bold sm:text-2xl">⚡ ElectroCAD AI</div>
            <div className="mt-1 text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Administrador SaaS' : 'Assinante'}</div>
          </div>
          <button type="button" aria-label="Fechar menu" onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
          {menu.map((item) => (
            <NavLink key={`${item.path}-${item.label}`} to={item.path} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 transition sm:px-4 ${isActive ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
