import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

type Plan = {
  id: string;
  name: string;
  price: string;
  trialDays: number;
  description: string;
  features: string[];
};

const fallbackPlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 49",
    trialDays: 14,
    description: "Para quem está começando e quer organizar seus projetos elétricos.",
    features: ["Projetos", "Clientes", "Planta 2D", "Recursos básicos de IA"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 129",
    trialDays: 30,
    description: "Mais recursos e produtividade para profissionais que trabalham com projetos.",
    features: ["Tudo do Starter", "Projetista elétrico", "Professor IA", "Relatórios avançados"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$ 299",
    trialDays: 45,
    description: "Para profissionais e empresas que precisam de maior capacidade e recursos completos.",
    features: ["Tudo do Pro", "Maior capacidade", "Recursos premium disponíveis", "Suporte diferenciado"],
  },
];

const productFeatures = [
  {
    title: "Projetos organizados",
    text: "Centralize clientes, projetos e informações da sua operação em um único lugar.",
  },
  {
    title: "Planta 2D",
    text: "Crie e organize ambientes, pontos, portas e janelas de forma visual e prática.",
  },
  {
    title: "Dimensionamento",
    text: "Tenha apoio para organizar o dimensionamento e a documentação dos seus projetos.",
  },
  {
    title: "Professor IA",
    text: "Conte com um assistente para estudar, tirar dúvidas e apoiar sua rotina técnica.",
  },
];

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);

  useEffect(() => {
    let active = true;

    apiFetch("/plans", { cache: "no-store" })
      .then((data) => {
        if (active && Array.isArray(data) && data.length) {
          setPlans(data);
        }
      })
      .catch(() => {
        // Mantém os planos de fallback para a landing continuar disponível.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              ⚡
            </span>
            <div>
              <div className="text-lg font-bold tracking-tight">ElectroCAD-AI</div>
              <div className="text-xs text-slate-500">Projetos elétricos mais simples</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                Plataforma para projetos elétricos
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Organize seus projetos elétricos em um só lugar.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                O ElectroCAD-AI reúne projetos, clientes, planta 2D, dimensionamento e
                recursos de inteligência artificial em uma plataforma simples para
                profissionais e empresas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Começar agora
                </Link>
                <a
                  href="#planos"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver planos
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span>✓ Acesso pelo computador e celular</span>
                <span>✓ Projetos centralizados</span>
                <span>✓ Recursos de IA</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-7">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Seu espaço de trabalho
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">ElectroCAD-AI</h2>
                  </div>
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    2D
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Projetos", "Organizados"],
                    ["Clientes", "Centralizados"],
                    ["Planta", "2D"],
                    ["Professor", "IA"],
                  ].map(([title, value]) => (
                    <div key={title} className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">{title}</div>
                      <div className="mt-1 text-sm text-slate-500">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl bg-blue-600 p-4 text-white">
                  <div className="text-sm font-semibold">Mais organização. Menos retrabalho.</div>
                  <div className="mt-1 text-sm text-blue-100">
                    Tenha as principais ferramentas do projeto reunidas em uma única plataforma.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Recursos</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Tudo mais simples para você trabalhar.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Ferramentas pensadas para reduzir retrabalho e deixar sua rotina de projetos mais organizada.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {productFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600">
                    ✓
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Planos</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Escolha o plano ideal para sua rotina.
              </h2>
              <p className="mt-4 text-slate-600">
                Os valores e recursos abaixo são carregados do painel administrativo.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.id || plan.name}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.name.toLowerCase() === "pro"
                      ? "border-blue-500 bg-blue-50/30 shadow-md"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.name.toLowerCase() === "pro" && (
                    <span className="absolute -top-3 left-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      Mais escolhido
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">
                    {plan.description}
                  </p>

                  <div className="mt-5">
                    <span className="text-4xl font-bold tracking-tight text-slate-950">{plan.price}</span>
                    <span className="ml-1 text-sm text-slate-500">/mês</span>
                  </div>

                  <div className="mt-3 text-sm font-semibold text-blue-700">
                    {plan.trialDays > 0 ? `${plan.trialDays} dias para experimentar` : "Acesso imediato"}
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-slate-600">
                        <span className="font-bold text-blue-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition ${
                      plan.name.toLowerCase() === "pro"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {plan.name.toLowerCase() === "enterprise" ? "Quero o Enterprise" : `Começar com ${plan.name}`}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Pronto para organizar seus projetos?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Crie sua conta e conheça o ElectroCAD-AI.
            </p>
            <Link
              to="/register"
              className="mt-7 inline-flex rounded-lg bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Criar minha conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} ElectroCAD-AI</span>
          <span>Projetos elétricos com mais organização e tecnologia.</span>
        </div>
      </footer>
    </div>
  );
}
