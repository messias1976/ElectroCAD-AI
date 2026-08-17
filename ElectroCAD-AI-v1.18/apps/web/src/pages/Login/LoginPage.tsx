import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { setStoredUser } from "../../services/auth";
import { API_URL } from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message || "Erro ao fazer login.");
        return;
      }

      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
        if (result.user) setStoredUser(result.user);
        setMessage("Login realizado com sucesso! Redirecionando...");
        navigate("/dashboard", { replace: true });
        return;
      }

      setMessage("Login realizado com sucesso! Token recebido.");
      console.log("Login result:", result);
    } catch (error) {
      setMessage("Não foi possível conectar ao backend.");
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Login</h1>
      <p className="text-sm text-slate-500 mb-8">
        Acesse sua conta para gerenciar projetos, assinaturas e cobranças.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Usuário ou e-mail</span>
          <input
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            placeholder="Informe seu usuário ou e-mail"
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
          Entrar
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
