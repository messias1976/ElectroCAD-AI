export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Métricas</h2>
        <p className="mt-2 text-sm text-slate-500">
          Acompanhe crescimento, retenção e desempenho comercial da plataforma.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">MRR</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">R$ 48.250</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Retenção</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">94,2%</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">CAC</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">R$ 390</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Resumo do trimestre</h3>
        <p className="mt-3 text-sm text-slate-500">
          Crescimento de 12% na base de clientes, queda de 2,1% em churn e aumento de receita recorrente.
        </p>
      </div>
    </div>
  );
}
