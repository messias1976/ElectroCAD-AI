import { NavLink } from 'react-router-dom';
import { House, CreditCard, Users, TrendingUp, CircuitBoard, PenTool, Bot, Settings, FolderKanban, Calculator, UserCircle, X, FileText, BookOpen, LayoutTemplate } from 'lucide-react';
import { getStoredUser } from '../../services/auth';

const common=[
 {label:'Dashboard',icon:House,path:'/dashboard'},
 {label:'Projetos',icon:FolderKanban,path:'/projects'},
 {label:'Clientes',icon:Users,path:'/clients'},
 {label:'Modelos',icon:LayoutTemplate,path:'/projects'},
 {label:'Planta elétrica',icon:PenTool,path:'/planta'},
 {label:'Projetista',icon:CircuitBoard,path:'/projetista'},
 {label:'Relatórios',icon:FileText,path:'/dimensionamento'},
 {label:'Biblioteca NBR 5410',icon:BookOpen,path:'/dimensionamento'},
 {label:'Professor IA',icon:Bot,path:'/professor'},
];
const admin=[
 {label:'Planos e Assinatura',icon:CreditCard,path:'/subscriptions'},
 {label:'Usuários',icon:Users,path:'/dashboard'},
 {label:'Configurações',icon:Settings,path:'/configuracoes-ia'},
 {label:'Métricas SaaS',icon:TrendingUp,path:'/metrics'},
];
type Props={open:boolean;onClose:()=>void};
export default function Sidebar({open,onClose}:Props){
 const user=getStoredUser(); const menu=user?.role==='ADMIN'?[...common,...admin]:common;
 return <>
  <div className={`fixed inset-0 z-40 bg-slate-950/55 lg:hidden ${open?'opacity-100':'pointer-events-none opacity-0'}`} onClick={onClose}/>
  <aside className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#061426] text-white shadow-2xl print:hidden ${open?'translate-x-0':'-translate-x-full'} transition-transform duration-200 lg:translate-x-0`}>
   <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
    <span className="text-3xl text-blue-400">⚡</span><div><div className="text-lg font-black tracking-tight">ElectroCAD-AI</div><div className="text-[10px] text-slate-400">{user?.role==='ADMIN'?'Administrador SaaS':'Dimensionamento Elétrico'}</div></div>
    <button className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-white/10 lg:hidden" onClick={onClose}><X size={20}/></button>
   </div>
   <nav className="flex-1 overflow-y-auto px-3 py-4"><div className="space-y-1">
    {menu.map(item=><NavLink key={item.label} to={item.path} onClick={onClose} className={({isActive})=>`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${isActive?'bg-blue-600 text-white shadow-sm':'text-slate-300 hover:bg-white/5 hover:text-white'}`}><item.icon size={18}/><span>{item.label}</span></NavLink>)}
   </div></nav>
   <div className="border-t border-white/10 p-3"><NavLink to="/perfil" className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-black">{(user?.username||'MM').slice(0,2).toUpperCase()}</span><div className="min-w-0"><div className="truncate text-xs font-bold">{user?.username||'Usuário'}</div><div className="truncate text-[10px] text-slate-400">{user?.role==='ADMIN'?'Administrador':'Profissional'}</div></div></NavLink></div>
  </aside>
 </>;
}