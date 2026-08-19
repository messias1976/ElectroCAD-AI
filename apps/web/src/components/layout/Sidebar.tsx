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

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: Props) {
  const user = getStoredUser();
  const menu = user?.role === 'ADMIN' ? [...common, ...admin] : common;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] max-w-full flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200 ease-out print:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-slate-700 p-5 sm:p-6">
          <div>
            <div className="text-xl font-bold sm:text-2xl">⚡ ElectroCAD AI</div>
            <div className="mt-1 text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Administrador SaaS' : 'Assinante'}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Fechar menu">
            <X size={22} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2">
            {menu.map((item) => (
              <NavLink
                key={`${item.path}-${item.label}`}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 transition ${isActive ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
