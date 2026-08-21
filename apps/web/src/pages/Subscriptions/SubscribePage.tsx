import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Clock3, Loader2 } from 'lucide-react';
import { apiFetch } from '../../services/api';

type Access = { daysRemaining: number; trialDays: number; trialEndsAt: string; plan: string; subscriptionStatus: string; hasActiveSubscription: boolean; requiresSubscription: boolean };
type Plan = { id: string; name: string; price: string; trialDays: number; description: string; features: string[] };

export default function SubscribePage() {
  const [access, setAccess] = useState<Access | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingType, setBillingType] = useState<'UNDEFINED' | 'PIX' | 'BOLETO' | 'CREDIT_CARD'>('UNDEFINED');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/subscriptions/me'), apiFetch('/plans')])
      .then(([accessData, plansData]) => { setAccess(accessData); setPlans(Array.isArray(plansData) ? plansData : []); })
      .catch(() => setFeedback('Não foi possível carregar os planos.'));
  }, []);

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCpfCnpj('');
    setBillingType('UNDEFINED');
    setFeedback('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const subscribe = async () => {
    if (!selectedPlan) return;
    const document = cpfCnpj.replace(/\D/g, '');
    if (document.length !== 11 && document.length !== 14) {
      setFeedback('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) para continuar.');
      return;
    }
    setLoading(true);
    setFeedback('Criando sua assinatura no Asaas...');
    try {
      const result = await apiFetch('/subscriptions/checkout', { method: 'POST', body: JSON.stringify({ plan: selectedPlan.name, billingType, cpfCnpj: document }) });
      setFeedback(result?.trialApplied ? `Plano ${selectedPlan.name} reservado. A primeira cobrança está prevista para ${new Date(`${result.firstChargeDate}T00:00:00`).toLocaleDateString('pt-BR')}.` : `Plano ${selectedPlan.name} criado no Asaas. Aguarde a confirmação do pagamento para a liberação.`);
      setAccess(await apiFetch('/subscriptions/me'));
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível criar a assinatura.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div><h2 className="text-3xl font-bold text-slate-900">Assinatura do ElectroCAD-AI</h2><p className="mt-2 text-sm text-slate-500">{selectedPlan ? 'Confira o plano escolhido e preencha seus dados para continuar.' : 'Escolha primeiro o plano que deseja contratar.'}</p></div>
      {access && !access.hasActiveSubscription && <div className={`rounded-3xl border p-6 ${access.requiresSubscription ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}><div className="flex items-center gap-3"><Clock3 className="text-blue-600" /><div><h3 className="font-bold text-slate-900">{access.requiresSubscription ? 'Seu período gratuito terminou' : `${access.daysRemaining} dia(s) restantes no teste gratuito`}</h3><p className="mt-1 text-sm text-slate-600">Término do teste: {new Date(access.trialEndsAt).toLocaleDateString('pt-BR')}</p></div></div></div>}
      {feedback && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">{feedback}</div>}

      {!selectedPlan ? (
        <section>
          <div className="mb-5"><h3 className="text-xl font-bold text-slate-900">Escolha seu plano</h3><p className="mt-1 text-sm text-slate-500">Clique no plano desejado. Só depois disso aparecerão os dados e a forma de pagamento.</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <button key={plan.id} type="button" onClick={() => selectPlan(plan)} className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-slate-900">{plan.name}</h3><p className="mt-2 text-2xl font-bold text-blue-700">{plan.price}<span className="ml-1 text-sm font-medium text-slate-500">/mês</span></p></div>{plan.name.toLowerCase() === 'pro' && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">Popular</span>}</div>
                <p className="mt-4 text-sm leading-6 text-slate-500">{plan.description}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature}><CheckCircle2 className="mr-2 inline text-emerald-600" size={16} />{feature}</li>)}</ul>
                <span className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white group-hover:bg-blue-700">Ver e assinar {plan.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl">
          <button type="button" onClick={() => setSelectedPlan(null)} className="mb-4 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} /> Voltar para os planos</button>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Plano selecionado</p><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-2xl font-bold text-slate-900">{selectedPlan.name}</h3><p className="text-sm text-slate-600">{selectedPlan.description}</p></div><div className="text-2xl font-bold text-blue-700">{selectedPlan.price}<span className="text-sm font-medium text-slate-500">/mês</span></div></div></div>
            <div className="mt-7 space-y-5">
              <div><label htmlFor="cpfCnpj" className="mb-2 block text-sm font-semibold text-slate-800">CPF ou CNPJ</label><input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="Digite seu CPF ou CNPJ" inputMode="numeric" autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><p className="mt-1 text-xs text-slate-500">Esse documento será usado para cadastrar o cliente no Asaas.</p></div>
              <div><label htmlFor="billingType" className="mb-2 block text-sm font-semibold text-slate-800">Forma de pagamento</label><select id="billingType" value={billingType} onChange={(e) => setBillingType(e.target.value as typeof billingType)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="UNDEFINED">Escolher na cobrança</option><option value="PIX">Pix</option><option value="BOLETO">Boleto</option><option value="CREDIT_CARD">Cartão de crédito</option></select></div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"><b className="text-slate-900">Próximo passo</b><p className="mt-1">O ElectroCAD-AI cadastra seus dados no Asaas, cria a assinatura e acompanha a confirmação do pagamento automaticamente.</p></div>
              <button type="button" onClick={subscribe} disabled={loading} className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 size={18} className="mr-2 inline animate-spin" /> Processando...</> : <><CreditCard size={18} className="mr-2 inline" /> Confirmar e assinar {selectedPlan.name}</>}</button>
            </div>
          </div>
        </section>
      )}
      <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600"><CheckCircle2 className="mr-2 inline text-emerald-600" size={17} />O ElectroCAD-AI confirma o pagamento através dos webhooks do Asaas antes de liberar a assinatura.</div>
    </div>
  );
}
