import { useState, type FormEvent } from "react";

type WorkItem = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

export default function WorksPage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Em andamento");
  const [works, setWorks] = useState<WorkItem[]>([
    { id: 1, name: "Obra Centro", status: "Em andamento", createdAt: "Hoje" },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback("Informe o nome da obra antes de salvar.");
      return;
    }

    setWorks((current) => [
      ...current,
      { id: Date.now(), name: trimmedName, status, createdAt: "Agora" },
    ]);
    setName("");
    setStatus("Em andamento");
    setFeedback("Obra cadastrada com sucesso.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Obras</h2>
        <p className="mt-2 text-sm text-slate-500">
          Organize as obras e acompanhe o status das entregas.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Nova obra</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome da obra</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Ex: Obra Centro"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            >
              <option>Em andamento</option>
              <option>Planejada</option>
              <option>Concluída</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-2xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          Salvar obra
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Lista de obras</h3>
        <div className="mt-4 space-y-3">
          {works.map((work) => (
            <div key={work.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-900">{work.name}</p>
                <p className="text-sm text-slate-500">{work.status}</p>
              </div>
              <span className="text-sm text-slate-500">{work.createdAt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
