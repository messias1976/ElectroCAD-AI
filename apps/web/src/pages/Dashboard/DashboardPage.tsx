import { useEffect, useState } from 'react';
import { Users, Clock3, CreditCard, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProfile, getStoredUser } from '../../services/auth';
import { apiFetch } from '../../services/api';

type Subscriber = {
  id: string; username: string; email?: string | null; plan: string;
  subscriptionStatus: string; daysRemaining: number; trialEndsAt: string;
  requiresSubscription: boolean; hasActiveSubscription: boolean;
};

export default function DashboardPage() {
  const [user, setUser] = useState(getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const isAdmin = user?.role === 'ADMIN';
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [access, setAccess] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile().then((profile) => setUser(profile)).catch(() => undefined).finally(() => setAuthLoading(false));
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      apiFetch('/subscriptions/admin/overview').then(setSubs).catch(() => setSubs([]));
    } else {
      apiFetch('/subscriptions/me').then(setAccess).catch(() => null);
      apiFetch('/clients').then(setClients).catch(() => setClients([]));
      apiFetch('/projects').then(setProjects).catch(() => setProjects([]));
    }
  }, [isAdmin, authLoading]);

  if (authLoading) return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Carregando seu painel...</div>;

  if (!isAdmin) {
    return (
      <div className="space-y-6 pb-12">
        <div><h2 className="text-3xl font-bold text-slate-900">Meu painel</h2><p className="mt-2 text-sm text-slate-500">Seu espaço de trabalho do ElectroCAD-AI.</p></div>
        {access && !access.hasActiveSubscription && (
          <div className={`flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 ${access.requiresSubscription ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <div><b>{access.requiresSubscription ? 'Seu período gratuito terminou.' : `${access.daysRemaining} dia(s) de teste gratuito restantes.`}</b><p className="mt-1 text-sm text-slate-600">Para continuar após o período gratuito, escolha um plano.</p></div>
            <Link to="/assinar" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Ver planos e assinar</Link>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Clientes', clients.length, 'Cadastros ativos'],
            ['Projetos', projects.length, 'Projetos no seu portfólio'],
            ['Plantas', projects.filter((p) => Boolean(p.plantData)).length, 'Projetos com planta salva'],
            ['Dimensionamentos', projects.filter((p) => Boolean(p.designData)).length, 'Projetos com dados do projetista'],
          ].map(([title, value, text]) => <div key={String(title)} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{title}</p><b className="mt-1 block text-3xl text-slate-900">{value}</b><span className="text-xs text-slate-500">{text}</span></div>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold">Meus clientes</h3><p className="text-sm text-slate-500">Dados reais da sua conta.</p></div><Link to="/clients" className="rounded-xl border px-3 py-2 text-sm font-semibold">Ver todos</Link></div>
            <div className="mt-4 space-y-2">
              {clients.length === 0 ? <p className="text-sm text-slate-500">Nenhum cliente cadastrado.</p> : clients.slice(0, 5).map((client) => <div key={client.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><b>{client.name}</b><p className="text-xs text-slate-500">{client.segment}</p></div><span className="text-xs text-slate-400">{client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : ''}</span></div>)}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h3 className="text-xl font-semibold">Projetos recentes</h3><p className="text-sm text-slate-500">Cada projeto conecta cliente, planta, projetista e Professor IA.</p></div><Link to="/projects" className="rounded-xl border px-3 py-2 text-sm font-semibold">Ver projetos</Link></div>
            <div className="mt-4 space-y-2">
              {projects.length === 0 ? <p className="text-sm text-slate-500">Nenhum projeto cadastrado.</p> : projects.slice(0, 5).map((project) => <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><b>{project.name}</b><p className="text-xs text-slate-500">Cliente: {project.client?.name || 'Não informado'}</p></div><div className="flex gap-2"><Link to={`/planta?projectId=${encodeURIComponent(project.id)}`} className="rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold">Planta</Link><Link to={`/projetista?projectId=${encodeURIComponent(project.id)}`} className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white">Projetista</Link></div></div>)}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const active = subs.filter(s => s.hasActiveSubscription).length;
  const trial = subs.filter(s => !s.hasActiveSubscription && !s.requiresSubscription).length;
  const expired = subs.filter(s => s.requiresSubscription).length;
  const remainingLabel = (trialEndsAt: string) => {
    const diff = Math.max(0, new Date(trialEndsAt).getTime() - now);
    if (diff <= 0) return '0 dias grátis';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `Restam ${days}d ${hours}h ${minutes}min grátis`;
  };

  return (
    <div className="space-y-6 pb-12">
      <div><h2 className="text-3xl font-bold text-slate-900">Painel administrativo SaaS</h2><p className="mt-2 text-sm text-slate-500">Acompanhe assinantes, testes gratuitos e conversão para planos pagos.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Assinantes', subs.length, Users],
          ['Ativos', active, CreditCard],
          ['Em teste', trial, Clock3],
          ['Aguardando assinatura', expired, AlertTriangle],
        ].map(([label, value, Icon]: any) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><Icon size={20} className="text-blue-600"/><p className="mt-3 text-sm text-slate-500">{label}</p><b className="text-2xl">{value}</b></div>)}
      </div>
      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-5"><div><h3 className="text-xl font-bold">Assinantes</h3><p className="text-sm text-slate-500">Dias de teste, plano e situação de cada conta.</p></div><Link to="/subscriptions" className="rounded-xl border px-4 py-2 text-sm font-semibold">Gerenciar planos</Link></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Usuário</th><th className="p-4">Plano</th><th className="p-4">Status</th><th className="p-4">Teste</th><th className="p-4">Ação</th></tr></thead><tbody>
          {subs.map(s => <tr key={s.id} className="border-t"><td className="p-4"><b>{s.username}</b><div className="text-xs text-slate-500">{s.email}</div></td><td className="p-4">{s.plan}</td><td className="p-4">{s.hasActiveSubscription ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Ativo</span> : s.requiresSubscription ? <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Assinatura necessária</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Teste grátis</span>}</td><td className="p-4">{s.hasActiveSubscription ? <span className="text-slate-400">—</span> : s.requiresSubscription ? <span className="font-semibold text-red-600">0 dias grátis</span> : <div><b className="text-amber-700">{remainingLabel(s.trialEndsAt)}</b><div className="text-xs text-slate-500">até {new Date(s.trialEndsAt).toLocaleDateString('pt-BR')}</div></div>}</td><td className="p-4">{s.requiresSubscription && s.email ? (
  <a href={`mailto:${s.email}?subject=${encodeURIComponent('Assinatura do ElectroCAD-AI')}&body=${encodeURIComponent('Olá! Seu período gratuito do ElectroCAD-AI terminou. Acesse a plataforma para escolher seu plano e realizar a assinatura.')}`} className="inline-block rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Enviar assinatura</a>
) : s.requiresSubscription ? 'E-mail não informado' : 'Acompanhando'}</td></tr>)}
          {!subs.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum assinante encontrado.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
