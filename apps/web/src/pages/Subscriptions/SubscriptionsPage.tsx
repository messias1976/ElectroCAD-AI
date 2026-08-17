import { useState } from "react";

type Plan = {
  id: number;
  name: string;
  price: string;
  trialDays: string;
  description: string;
  features: string[];
};

const STORAGE_KEY = "landing_plans";

const initialPlans: Plan[] = [
  {
    id: 1,
    name: "Starter",
    price: "R$ 49",
    trialDays: "14",
    description: "Ideal para pequenos times que querem começar com o básico.",
    features: ["1 projeto ativo", "Suporte por email", "Relatórios simples"],
  },
  {
    id: 2,
    name: "Pro",
    price: "R$ 129",
    trialDays: "30",
    description: "Para empresas que precisam de mais autonomia e controle.",
    features: ["10 projetos ativos", "Dashboards avançados", "Integrações básicas"],
  },
  {
    id: 3,
    name: "Enterprise",
    price: "R$ 299",
    trialDays: "45",
    description: "Para operações maiores com equipe e automação.",
    features: ["Projetos ilimitados", "IA e automações", "Suporte dedicado"],
  },
];

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleChange = (id: number, field: keyof Plan, value: string) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan)),
    );
  };

  const handleSendToLanding = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    setSyncStatus("Modificações enviadas para a landing page.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Assinaturas</h2>
        <p className="mt-2 text-sm text-slate-500">
          Configure os planos do seu SaaS, incluindo valores, período de teste gratuito e o que cada plano libera.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <b>Período gratuito:</b> novos assinantes começam com 14 dias de teste por padrão. O painel administrativo acompanha os dias restantes e identifica automaticamente quem precisa realizar a assinatura.
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {plan.price}/mês
              </span>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Nome do plano</span>
              <input
                value={plan.name}
                onChange={(event) => handleChange(plan.id, "name", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Valor mensal</span>
              <input
                value={plan.price}
                onChange={(event) => handleChange(plan.id, "price", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Dias de teste grátis</span>
              <input
                type="number"
                min="0"
                value={plan.trialDays}
                onChange={(event) => handleChange(plan.id, "trialDays", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Descrição</span>
              <textarea
                value={plan.description}
                onChange={(event) => handleChange(plan.id, "description", event.target.value)}
                className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">O que este plano libera</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Resumo de configuração</h3>
        <p className="mt-2 text-sm text-slate-500">
          Você pode ajustar rapidamente os valores, o período gratuito e as permissões liberadas por cada plano.
        </p>
        <button
          onClick={handleSendToLanding}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Enviar para landing page
        </button>
        {syncStatus ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">{syncStatus}</p>
        ) : null}
      </div>
    </div>
  );
}
