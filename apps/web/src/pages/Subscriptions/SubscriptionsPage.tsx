import { useEffect, useState } from "react";
import { apiFetch } from "../../services/api";

type Plan = {
  id: string;
  name: string;
  price: string;
  trialDays: number;
  description: string;
  features: string[];
};

const fallbackPlans: Plan[] = [
  { id: "starter", name: "Starter", price: "R$ 49", trialDays: 14, description: "Ideal para pequenos times que querem começar com o básico.", features: ["1 projeto ativo", "Suporte por email", "Relatórios simples"] },
  { id: "pro", name: "Pro", price: "R$ 129", trialDays: 30, description: "Para empresas que precisam de mais autonomia e controle.", features: ["10 projetos ativos", "Dashboards avançados", "Integrações básicas"] },
  { id: "enterprise", name: "Enterprise", price: "R$ 299", trialDays: 45, description: "Para operações maiores com equipe e automação.", features: ["Projetos ilimitados", "IA e automações", "Suporte dedicado"] },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/plans')
      .then((data) => setPlans(Array.isArray(data) && data.length ? data : fallbackPlans))
      .catch(() => setSyncStatus('Não foi possível carregar os planos do servidor.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id: string, field: keyof Plan, value: string) => {
    setPlans((current) => current.map((plan) => plan.id === id ? { ...plan, [field]: field === 'trialDays' ? Number(value) : value } : plan));
    setSyncStatus(null);
  };

  const handleSendToLanding = async () => {
    setSaving(true);
    setSyncStatus(null);
    try {
      const saved = await apiFetch('/plans', { method: 'PUT', body: JSON.stringify(plans) });
      setPlans(saved);
      setSyncStatus('✓ Planos salvos no banco. A landing page usa os mesmos valores no desktop e no celular.');
    } catch (error) {
      setSyncStatus(`Erro ao salvar: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Assinaturas</h2>
        <p className="mt-2 text-sm text-slate-500">Configure os planos do seu SaaS, incluindo valores, período de teste gratuito e recursos.</p>
      </div>
      {loading ? <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Carregando planos...</div> : null}
      <div className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{plan.price}/mês</span></div>
            <label className="mt-4 block"><span className="text-sm font-medium text-slate-700">Nome do plano</span><input value={plan.name} onChange={(e) => handleChange(plan.id, 'name', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" /></label>
            <label className="mt-4 block"><span className="text-sm font-medium text-slate-700">Valor mensal</span><input value={plan.price} onChange={(e) => handleChange(plan.id, 'price', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" /></label>
            <label className="mt-4 block"><span className="text-sm font-medium text-slate-700">Dias de teste grátis</span><input type="number" min="0" value={plan.trialDays} onChange={(e) => handleChange(plan.id, 'trialDays', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" /></label>
            <label className="mt-4 block"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea value={plan.description} onChange={(e) => handleChange(plan.id, 'description', e.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" /></label>
            <div className="mt-4"><p className="text-sm font-medium text-slate-700">O que este plano libera</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{plan.features.map((feature) => <li key={feature} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">{feature}</li>)}</ul></div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Resumo de configuração</h3>
        <p className="mt-2 text-sm text-slate-500">Os valores são salvos no banco de dados e passam a ser compartilhados pela landing page em qualquer dispositivo.</p>
        <button disabled={saving} onClick={handleSendToLanding} className="mt-6 inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-70">
          {saving ? 'Salvando...' : 'Salvar e publicar na landing page'}
        </button>
        {syncStatus ? <p className="mt-3 text-sm font-medium text-emerald-700">{syncStatus}</p> : null}
      </div>
    </div>
  );
}
