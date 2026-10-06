import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';
import { clearStoredUser, getStoredUser } from '../../services/auth';

type Props={onOpenMenu:()=>void};
export default function Header({onOpenMenu}:Props){
 const navigate=useNavigate(); const user=getStoredUser(); const isAdmin=user?.role==='ADMIN';
 const handleLogout=()=>{localStorage.removeItem('access_token');clearStoredUser();navigate('/login',{replace:true});};
 const initials=(user?.username||'MM').slice(0,2).toUpperCase();
 return <header className="app-header flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 print:hidden">
  <div className="flex min-w-0 items-center gap-3"><button onClick={onOpenMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu"><Menu size={21}/></button><div className="relative hidden min-w-0 flex-1 md:block md:max-w-md"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input aria-label="Buscar" placeholder="Buscar projetos, clientes..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400"/></div></div>
  <div className="flex items-center gap-3"><button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell size={19}/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"/></button><NavLink to="/perfil" className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#13233a] text-xs font-black text-white">{initials}</span><span className="hidden text-left md:block"><b className="block max-w-32 truncate text-xs text-slate-800">{user?.username||'Usuário'}</b><small className="text-[10px] text-slate-400">{isAdmin?'Administrador':'Profissional'}</small></span></NavLink><button onClick={handleLogout} className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:block">Sair</button></div>
 </header>;
}