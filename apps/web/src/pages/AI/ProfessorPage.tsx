import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Loader2, Send, Settings, Sparkles, User, Wrench } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { askProfessor, getAiStatus } from '../../services/ai';
import { apiFetch } from '../../services/api';

type Message = { role: 'user' | 'assistant'; text: string };

export default function ProfessorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Sou o Professor ElectroCAD. A IA é configurada pelo administrador e fica disponível para os assinantes. Posso analisar a planta, o quadro de cargas e explicar o dimensionamento.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState('');
  const [projectContext, setProjectContext] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const activeProjectId = searchParams.get('projectId') || projectContext?.id;
  const user = JSON.parse(localStorage.getItem('electrocad-user') || 'null');
  const isAdmin = user?.role === 'ADMIN';
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    const load = async () => {
      try {
        if (projectId) {
          setProjectContext(await apiFetch(`/projects/${projectId}`));
        } else {
          const projects = await apiFetch('/projects');
          setProjectContext(projects?.[0] || null);
        }
      } catch {
        setProjectContext(null);
      } finally {
        setProjectLoading(false);
      }
    };
    void load();
  }, [searchParams]);

  useEffect(() => {
    getAiStatus()
      .then((status: any) => setConfigured(Boolean(status?.configured)))
      .catch(() => setConfigured(false))
      .finally(() => setCheckingConfig(false));
  }, []);

  async function send(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();
    if (!message || loading) return;
    if (!configured) {
      setError('O Professor IA está indisponível no momento. O administrador do SaaS precisa configurar a OpenAI no servidor.');
      return;
    }

    setInput('');
    setError('');
    setMessages((items) => [...items, { role: 'user', text: message }]);
    setLoading(true);

    try {
      const result = await askProfessor(message, projectContext, activeProjectId || undefined);
      setMessages((items) => [...items, { role: 'assistant', text: result.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao consultar o Professor IA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            <Bot className="mr-2 inline text-blue-600" />Professor ElectroCAD
          </h2>
          <p className="mt-1 text-sm text-slate-500">Assistente técnico conectado ao projeto atual.</p>
          {projectLoading ? <p className="mt-2 text-xs text-slate-500">Carregando projeto do servidor...</p> : projectContext ? <p className="mt-2 text-xs font-semibold text-blue-700">Projeto: {projectContext.name} · Cliente: {projectContext.client?.name || 'Não informado'}</p> : <p className="mt-2 text-xs text-amber-700">Nenhum projeto selecionado. Abra o Professor a partir de um projeto para análise completa.</p>}
        </div>
        {isAdmin && (
          <Link to="/configuracoes-ia" className="rounded-xl border bg-white px-4 py-2 font-semibold hover:bg-slate-50">
            <Settings className="mr-2 inline" size={17} />Configurar IA
          </Link>
        )}
      </div>

      <div className={`rounded-xl border p-4 text-sm ${checkingConfig ? 'border-slate-200 bg-slate-50 text-slate-700' : configured ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {checkingConfig
          ? <>⏳ Verificando disponibilidade do Professor IA...</>
          : configured
            ? <><CheckCircle2 className="mr-2 inline" size={17} />IA disponível. A chave fica protegida no backend e não é enviada ao assinante.</>
            : <>⚠️ O Professor IA está aguardando a configuração da OpenAI pelo administrador.</>}
      </div>

      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2"><Bot size={22} /></div>
            <div>
              <b>Professor ElectroCAD</b>
              <p className="text-xs text-slate-300">Análise de projeto elétrico • pré-dimensionamento</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'border bg-white text-slate-800 shadow-sm'}`}>
                <div className="mb-1 text-xs font-bold opacity-70">
                  {m.role === 'user'
                    ? <><User size={13} className="mr-1 inline" />Você</>
                    : <><Bot size={13} className="mr-1 inline" />Professor ElectroCAD</>}
                </div>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={17} />Analisando o projeto...</div>}
        </div>

        <div className="border-t p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={() => send('Analise o projeto atual e me diga os principais alertas técnicos.')} disabled={loading || !configured} className="rounded-full border px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">
              <Sparkles className="mr-1 inline" size={14} />Analisar projeto
            </button>
            <button onClick={() => send('Revise preliminarmente a distribuição dos circuitos e diga o que devo conferir.')} disabled={loading || !configured} className="rounded-full border px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">
              <Wrench className="mr-1 inline" size={14} />Revisar circuitos
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={configured ? 'Ex.: Analise o circuito do chuveiro.' : 'Aguardando configuração da OpenAI pelo administrador...'}
              rows={2}
              className="min-h-[58px] flex-1 resize-none rounded-xl border p-3 outline-none focus:border-blue-500"
              disabled={!configured}
            />
            <button onClick={() => send()} disabled={loading || !input.trim() || !configured} className="self-end rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>

          {error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      </section>

      <p className="text-xs text-slate-500">A IA é assistente técnico. As respostas não substituem projeto, cálculo completo, inspeção ou responsabilidade técnica de profissional habilitado.</p>
    </div>
  );
}
