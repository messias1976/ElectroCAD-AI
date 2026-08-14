import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message || "Erro ao registrar usuário.");
        return;
      }

      setMessage("Cadastro realizado com sucesso! Redirecionando para login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
      console.log("Cadastro result:", result);
    } catch (error) {
      setMessage("Não foi possível conectar ao backend.");
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Cadastrar</h1>
      <p className="text-sm text-slate-500 mb-8">
        Crie sua conta para gerenciar projetos e assinaturas.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nome de usuário</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            placeholder="ex: jose123"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            placeholder="seu@email.com"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            placeholder="••••••••"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white font-semibold transition hover:bg-blue-700"
        >
          Criar conta
        </button>
      </form>

      {message ? (
        <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
    </div>
  );
}
