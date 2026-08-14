import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Clock3 } from 'lucide-react';
import { apiFetch } from '../../services/api';

type Access = {
  daysRemaining: number;
  trialDays: number;
  trialEndsAt: string;
  plan: string;
  subscriptionStatus: string;
  hasActiveSubscription: boolean;
  requiresSubscription: boolean;
};

export default function SubscribePage() {
  const [access, setAccess] = useState<Access | null>(null);
  useEffect(() => { apiFetch('/subscriptions/me').then(setAccess).catch(() => null); }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Assinatura do ElectroCAD-AI</h2>
        <p className="mt-2 text-sm text-slate-500">Acompanhe seu período gratuito e escolha como continuar usando a plataforma.</p>
      </div>
      {access && !access.hasActiveSubscription && (
        <div className={`rounded-3xl border p-6 ${access.requiresSubscription ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
          <div className="flex items-center gap-3">
            <Clock3 className="text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900">{access.requiresSubscription ? 'Seu período gratuito terminou' : `${access.daysRemaining} dia(s) restantes no teste gratuito`}</h3>
              <p className="mt-1 text-sm text-slate-600">Término do teste: {new Date(access.trialEndsAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['Starter', 'R$ 49/mês', 'Projetos essenciais, clientes e ferramentas do projetista.'],
          ['Pro', 'R$ 129/mês', 'Mais projetos, relatórios e recursos de IA.'],
          ['Enterprise', 'R$ 299/mês', 'Recursos avançados para equipes e operações maiores.'],
        ].map(([name, price, description]) => (
          <div key={name} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="mt-2 text-2xl font-bold text-blue-700">{price}</p>
            <p className="mt-3 text-sm text-slate-500">{description}</p>
            <button className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
              <CreditCard size={17} className="mr-2 inline" /> Solicitar assinatura
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600">
        <CheckCircle2 className="mr-2 inline text-emerald-600" size={17} />
        A liberação financeira do plano deve ser confirmada pelo gateway configurado no SaaS.
      </div>
    </div>
  );
}
