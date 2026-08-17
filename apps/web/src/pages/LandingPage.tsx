import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";


const initialPlans = [
  { id: "starter", name: "Starter", price: "R$ 49", trialDays: 14, description: "Ideal para começar com automação leve, IA prática e gestão simples no dia a dia.", features: ["1 projeto ativo", "IA básica", "Assistente inteligente", "Relatórios básicos"] },
  { id: "pro", name: "Pro", price: "R$ 129", trialDays: 30, description: "Para empresas que querem mais automação, IA avançada e produtividade em escala.", features: ["10 projetos ativos", "IA avançada", "Automações inteligentes", "Dashboards avançados"] },
  { id: "enterprise", name: "Enterprise", price: "R$ 299", trialDays: 45, description: "Para operações maiores com equipe, IA premium e suporte dedicado.", features: ["Projetos ilimitados", "IA premium e automações", "Suporte dedicado", "Gestão comercial completa"] },
];

export default function LandingPage() {
  const [plans, setPlans] = useState(initialPlans);

  useEffect(() => {
    let active = true;
    apiFetch('/plans', { cache: 'no-store' })
      .then((data) => {
        if (active && Array.isArray(data) && data.length) setPlans(data);
      })
      .catch(() => {
        // Keep defaults if the API is temporarily unavailable.
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Solução SaaS para projetos elétricos
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
              <span className="block text-sky-400">ElectroCAD AI</span>
              <span className="mt-2 block">Transforme orçamentos, projetos e gestão elétrica com IA.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              ElectroCAD AI ajuda eletricistas e pequenas empresas a acelerar projetos, automatizar cálculos, gerar propostas e controlar clientes em uma única plataforma.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-8 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Começar agora
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-8 py-3 text-base font-semibold text-white transition hover:border-slate-400 hover:text-slate-100"
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-900/20 backdrop-blur-lg">
            <div className="space-y-6 text-slate-100">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-sky-300">O que você ganha</p>
                <h2 className="mt-3 text-3xl font-semibold">Controle total do seu negócio elétrico</h2>
              </div>
              <ul className="space-y-4 text-slate-300">
                <li className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
                  <strong className="block text-lg font-semibold text-white">Dashboard administrativo</strong>
                  Monitoramento em tempo real de projetos, assinaturas e receita.
                </li>
                <li className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
                  <strong className="block text-lg font-semibold text-white">Cadastro rápido</strong>
                  Crie clientes, obras e orçamentos com menos erros e mais velocidade.
                </li>
                <li className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
                  <strong className="block text-lg font-semibold text-white">IA técnica</strong>
                  Sugestões inteligentes para bitolas, proteções e listas de materiais.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Planos</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Planos com IA integrada para sua operação</h2>
            <p className="mt-3 text-lg text-slate-300">
              Todos os planos incluem teste grátis e recursos com IA para acelerar projetos, propostas e gestão.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-medium text-sky-300">
                    IA inclusa · {plan.trialDays} dias grátis
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-400">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="ml-2 text-slate-400">/mês</span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Escolher {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
