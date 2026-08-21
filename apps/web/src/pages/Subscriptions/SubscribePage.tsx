import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Clock3, Loader2 } from 'lucide-react';
import { apiFetch } from '../../services/api';

type Access = { daysRemaining: number; trialDays: number; trialEndsAt: string; plan: string; subscriptionStatus: string; hasActiveSubscription: boolean; requiresSubscription: boolean; };
type Plan = { id: string; name: string; price: string; trialDays: number; description: string; features: string[]; };

export default function SubscribePage() {
  const [access, setAccess] = useState<Access | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingType, setBillingType] = useState<'UNDEFINED' | 'PIX' | 'BOLETO' | 'CREDIT_CARD'>('UNDEFINED');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => { Promise.all([apiFetch('/subscriptions/me'), apiFetch('/plans')]).then(([accessData, plansData]) => { setAccess(accessData); setPlans(Array.isArray(plansData) ? plansData : []); }).catch(() => setFeedback('Não foi possível carregar os planos.')); }, []);

  const subscribe = async (plan: Plan) => {
    const document = cpfCnpj.replace(/\D/g, '');
    if (document.length !== 11 && document.length !== 14) { setFeedback('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) para continuar.'); return; }
    setLoadingPlan(plan.name); setFeedback('Criando sua assinatura no Asaas...');
    try {
      const result = await apiFetch('/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ plan: plan.name, billingType, cpfCnpj: document }) });
      setFeedback(result?.trialApplied ? `Plano ${plan.name} reservado. A primeira cobrança está prevista para ${new Date(`${result.firstChargeDate}T00:00:00`).toLocaleDateString('pt-BR')}.` : `Plano ${plan.name} criado no Asaas. Aguarde a confirmação do pagamento para a liberação.`);
      setAccess(await apiFetch('/subscriptions/me'));
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível criar a assinatura.'); }
    finally { setLoadingPlan(null); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div><h2 className="text-3xl font-bold text-slate-900">Assinatura do ElectroCAD-AI</h2><p className="mt-2 text-sm text-slate-500">Escolha seu plano. O pagamento é processado pelo Asaas e a liberação ocorre após a confirmação.</p></div>
      {access && !access.hasActiveSubscription && <div className={`rounded-3xl border p-6 ${access.requiresSubscription ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}><div className="flex items-center gap-3"><Clock3 className="text-blue-600" /><div><h3 className="font-bold text-slate-900">{access.requiresSubscription ? 'Seu período gratuito terminou' : `${access.daysRemaining} dia(s) restantes no teste gratuito`}</h3><p className="mt-1 text-sm text-slate-600">Término do teste: {new Date(access.trialEndsAt).toLocaleDateString('pt-BR')}</p></div></div></div>}
      <div className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">CPF ou CNPJ<input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="Digite somente seu CPF ou CNPJ" inputMode="numeric" autoComplete="off" className="mt-2 w-full rounded-xl border px-3 py-2 font-normal outline-none focus:border-blue-500" /></label>
        <label className="text-sm font-semibold text-slate-700">Forma de pagamento<select value={billingType} onChange={(e) => setBillingType(e.target.value as typeof billingType)} className="mt-2 w-full rounded-xl border px-3 py-2 font-normal"><option value="UNDEFINED">Escolher na cobrança</option><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CREDIT_CARD">Cartão de crédito</option></select></label>
      </div>
      {feedback && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{feedback}</div>}
      <div className="grid gap-5 md:grid-cols-3">{plans.map((plan) => <div key={plan.id} className="rounded-3xl border bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">{plan.name}</h3><p className="mt-2 text-2xl font-bold text-blue-700">{plan.price}/mês</p><p className="mt-3 text-sm text-slate-500">{plan.description}</p><ul className="mt-4 space-y-2 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature}><CheckCircle2 className="mr-2 inline text-emerald-600" size={16} />{feature}</li>)}</ul><button onClick={() => subscribe(plan)} disabled={loadingPlan !== null} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loadingPlan === plan.name ? <><Loader2 size={17} className="mr-2 inline animate-spin" /> Processando...</> : <><CreditCard size={17} className="mr-2 inline" /> Assinar {plan.name}</>}</button></div>)}</div>
      <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600"><CheckCircle2 className="mr-2 inline text-emerald-600" size={17} />O ElectroCAD-AI confirma o pagamento através dos webhooks do Asaas antes de liberar a assinatura.</div>
    </div>
  );
}
