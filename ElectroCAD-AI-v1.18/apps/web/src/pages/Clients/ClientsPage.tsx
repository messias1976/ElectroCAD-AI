import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../services/api";

type ClientItem = {
  id: string;
  name: string;
  segment: string;
  createdAt: string;
  _count?: { projects: number };
};

export default function ClientsPage() {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await apiFetch("/clients");
      setClients(data);
    } catch (error) {
      setFeedback(`Erro ao carregar clientes: ${(error as Error).message}`);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedSegment = segment.trim();

    if (!trimmedName || !trimmedSegment) {
      setFeedback("Preencha nome e segmento para cadastrar um cliente.");
      return;
    }

    try {
      await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({ name: trimmedName, segment: trimmedSegment }),
      });
      setName("");
      setSegment("");
      await loadClients();
      setFeedback("Cliente cadastrado com sucesso.");
    } catch (error) {
      setFeedback(`Erro ao salvar cliente: ${(error as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Clientes</h2>
        <p className="mt-2 text-sm text-slate-500">
          Centralize os clientes do seu portfólio e acompanhe os principais dados.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Novo cliente</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Ex: Indústria Prime"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Segmento</span>
            <input
              type="text"
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              placeholder="Ex: Industrial"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 rounded-2xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          Salvar cliente
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Lista de clientes</h3>
        <div className="mt-4 space-y-3">
          {clients.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum cliente cadastrado ainda.</p>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-500">{client.segment} · {client._count?.projects ?? 0} projeto(s)</p>
                </div>
                <span className="text-sm text-slate-500">{client.createdAt}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
