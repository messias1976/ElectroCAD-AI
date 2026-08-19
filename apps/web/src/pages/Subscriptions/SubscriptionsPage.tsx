import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

type Plan = { id: string; name: string; price: string; trialDays: number; description: string; features: string[] };
type Subscriber = { id: string; username: string; email: string | null; plan: string; subscriptionStatus: string; paymentStatus: string; trialEndsAt: string; daysRemaining: number; accessStatus: string; provider: string | null; asaasSubscriptionId: string | null; asaasPaymentId: string | null };

const fallbackPlans: Plan[] = [
  { id: 'starter', name: 'Starter', price: 'R$ 49', trialDays: 14, description: 'Projetos, clientes e planta 2D para começar.', features: ['Projetos', 'Clientes', 'Planta 2D', 'Recursos básicos de IA'] },
  { id: 'pro', name: 'Pro', price: 'R$ 129', trialDays: 30, description: 'Mais capacidade e recursos técnicos para profissionais.', features: ['10 projetos ativos', 'Projetista elétrico', 'Professor IA', 'Recursos avançados de IA'] },
  { id: 'enterprise', name: 'Enterprise', price: 'R$ 299', trialDays: 0, description: 'Recursos completos e suporte dedicado para equipes.', features: ['Projetos ilimitados', 'Planta 2D', 'Projetista elétrico', 'Professor IA'] },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [savedPlans, savedSubscribers] = await Promise.all([apiFetch('/plans'), apiFetch('/subscriptions/admin/overview')]);
    if (Array.isArray(savedPlans) && savedPlans.length) setPlans(savedPlans);
    if (Array.isArray(savedSubscribers)) setSubscribers(savedSubscribers);
  };

  useEffect(() => { load().catch((error: Error) => setMessage(error.message)); }, []);

  const updatePlan = (id: string, patch: Partial<Plan>) => setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, ...patch } : plan));
  const savePlans = async () => {
    setSaving(true); setMessage(null);
    try { setPlans(await apiFetch('/plans', { method: 'PUT', body: JSON.stringify(plans) })); setMessage('Planos salvos no banco e publicados na landing page.'); }
    catch (error) { setMessage((error as Error).message); }
    finally { setSaving(false); }
  };

  const act = async (subscriber: Subscriber, action: 'trial' | 'plan' | 'cancel' | 'suspend' | 'reactivate' | 'delete') => {
    let path = `/subscriptions/admin/${subscriber.id}`;
    let method = 'POST';
    let body: string | undefined;
    if (action === 'trial') { const days = window.prompt('Quantos dias deseja acrescentar ao trial?'); if (!days) return; path += '/trial'; body = JSON.stringify({ days: Number(days) }); }
    if (action === 'plan') { const plan = window.prompt(`Novo plano (${plans.map((item) => item.name).join(', ')}):`, subscriber.plan); if (!plan) return; path += '/plan'; method = 'PUT'; body = JSON.stringify({ plan }); }
    if (action === 'cancel') path += '/cancel';
    if (action === 'suspend') path += '/suspend';
    if (action === 'reactivate') path += '/reactivate';
    if (action === 'delete') { if (!window.confirm(`Excluir ${subscriber.username} e seus dados associados?`)) return; method = 'DELETE'; }
    try { await apiFetch(path, { method, body }); await load(); setMessage('Ação concluída.'); }
    catch (error) { setMessage((error as Error).message); }
  };

  return <div className="space-y-8">
    <section><h2 className="text-3xl font-bold text-slate-900">Assinaturas</h2><p className="mt-2 text-sm text-slate-500">Gerencie planos, assinantes, testes e acesso.</p></section>
    {message && <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <section className="space-y-4"><div><h3 className="text-xl font-semibold">Planos</h3><p className="text-sm text-slate-500">A landing page consome estes mesmos registros do banco.</p></div>
      <div className="grid gap-5 xl:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <label className="block text-sm font-medium">Nome<input value={plan.name} onChange={(event) => updatePlan(plan.id, { name: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm font-medium">Preço<input value={plan.price} onChange={(event) => updatePlan(plan.id, { price: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm font-medium">Dias de trial<input type="number" min="0" value={plan.trialDays} onChange={(event) => updatePlan(plan.id, { trialDays: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm font-medium">Descrição<textarea value={plan.description} onChange={(event) => updatePlan(plan.id, { description: event.target.value })} className="mt-1 min-h-20 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm font-medium">Recursos (um por linha)<textarea value={plan.features.join('\n')} onChange={(event) => updatePlan(plan.id, { features: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} className="mt-1 min-h-24 w-full rounded-lg border p-2" /></label>
      </article>)}</div>
      <button disabled={saving} onClick={savePlans} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar planos'}</button>
    </section>
    <section className="space-y-4"><div><h3 className="text-xl font-semibold">Assinantes</h3><p className="text-sm text-slate-500">Dados de assinatura, trial, pagamento e Asaas.</p></div>
      <div className="overflow-x-auto rounded-2xl border bg-white"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Assinante', 'Plano e acesso', 'Trial', 'Pagamento', 'Asaas', 'Gerenciar'].map((heading) => <th key={heading} className="p-3 font-semibold">{heading}</th>)}</tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.id} className="border-t align-top"><td className="p-3"><div className="font-medium">{subscriber.username}</div><div className="text-slate-500">{subscriber.email ?? 'Sem email'}</div></td><td className="p-3">{subscriber.plan}<br /><span className="text-slate-500">{subscriber.subscriptionStatus} · {subscriber.accessStatus}</span></td><td className="p-3">{subscriber.daysRemaining} dias<br /><span className="text-slate-500">até {new Date(subscriber.trialEndsAt).toLocaleDateString('pt-BR')}</span></td><td className="p-3">{subscriber.paymentStatus}<br /><span className="text-slate-500">{subscriber.provider ?? '—'}</span></td><td className="p-3 break-all text-xs">Assinatura: {subscriber.asaasSubscriptionId ?? '—'}<br />Cobrança: {subscriber.asaasPaymentId ?? '—'}</td><td className="p-3"><div className="flex max-w-52 flex-wrap gap-2"><button onClick={() => void act(subscriber, 'trial')}>Trial</button><button onClick={() => void act(subscriber, 'plan')}>Plano</button><button onClick={() => void act(subscriber, 'cancel')}>Cancelar</button><button onClick={() => void act(subscriber, 'suspend')}>Suspender</button><button onClick={() => void act(subscriber, 'reactivate')}>Reativar</button><button onClick={() => void act(subscriber, 'delete')} className="text-red-700">Excluir</button></div></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
