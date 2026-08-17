import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Save, Settings2, TestTube2, Trash2, WifiOff } from 'lucide-react';
import { clearAiConfig, getAiConfig, getAiStatus, saveAiConfig, saveAiConfigServer, testAiConnection, clearAiConfigServer } from '../../services/ai';

export default function AISettingsPage() {
  const current = getAiConfig();
  const [apiKey, setApiKey] = useState(current.apiKey);
  const [model, setModel] = useState(current.model);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'ok' | 'error'; text: string }>({ type: 'idle', text: '' });
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    getAiStatus().then((s: any) => { setConfigured(Boolean(s.configured)); setModel(s.model || 'gpt-5-mini'); }).catch(() => undefined);
  }, []);

  async function save() {
    setLoading(true); setStatus({ type: 'idle', text: '' });
    try {
      const result: any = await saveAiConfigServer(apiKey, model, true);
      saveAiConfig('', result.model || model);
      setApiKey('');
      setConfigured(Boolean(result.configured));
      setStatus({ type: 'ok', text: 'Configuração salva no servidor. O Professor IA agora pode ser usado pelos assinantes conforme o plano.' });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar a configuração.' });
    } finally { setLoading(false); }
  }

  async function test() {
    setLoading(true); setStatus({ type: 'idle', text: '' });
    try {
      const result = await testAiConnection(apiKey, model);
      setStatus({ type: 'ok', text: result.message ?? 'Conexão com a OpenAI funcionando.' });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível testar a conexão.' });
    } finally { setLoading(false); }
  }

  async function clear() {
    setLoading(true);
    try {
      await clearAiConfigServer();
      clearAiConfig(); setApiKey(''); setConfigured(false);
      setStatus({ type: 'ok', text: 'Chave central removida do servidor.' });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Não foi possível remover a chave.' });
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div><h2 className="text-3xl font-bold text-slate-900">Configurações de IA</h2><p className="mt-1 text-sm text-slate-500">A configuração é centralizada no servidor para que o Professor possa atender os assinantes sem expor sua chave.</p></div>
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Settings2 /></div><div><h3 className="font-bold">Professor ElectroCAD</h3><p className="text-sm text-slate-500">A chave é armazenada criptografada no backend. Ela nunca é enviada ao navegador do assinante.</p></div></div>
        <div className="mt-6 space-y-5">
          <div className={`rounded-xl p-4 text-sm ${configured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{configured ? '🟢 OpenAI configurada no servidor.' : '🟡 OpenAI ainda não configurada no servidor.'}</div>
          <label className="block"><span className="text-sm font-semibold text-slate-700"><KeyRound className="mr-1 inline" size={16}/>Chave da API da OpenAI</span><div className="mt-2 flex gap-2"><input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type={showKey ? 'text' : 'password'} placeholder={configured ? '•••••••••••••••••••• (já configurada)' : 'sk-...'} autoComplete="off" className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"/><button type="button" onClick={() => setShowKey((v) => !v)} className="rounded-xl border px-3 hover:bg-slate-50" title={showKey ? 'Ocultar chave' : 'Mostrar chave'}>{showKey ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></label>
          <label className="block"><span className="text-sm font-semibold text-slate-700">Modelo</span><select value={model} onChange={(e) => setModel(e.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="gpt-5-mini">gpt-5-mini — recomendado</option><option value="gpt-5">gpt-5</option><option value="gpt-4.1-mini">gpt-4.1-mini</option></select></label>
          <div className="flex flex-wrap gap-3"><button onClick={save} disabled={loading || !apiKey.trim()} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"><Save className="mr-2 inline" size={17}/>Salvar no servidor</button><button onClick={test} disabled={loading || (!apiKey.trim() && !configured)} className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"><TestTube2 className="mr-2 inline" size={17}/>{loading ? 'Testando...' : 'Testar chave digitada'}</button><button onClick={clear} disabled={loading} className="rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 hover:bg-red-50"><Trash2 className="mr-2 inline" size={17}/>Remover chave</button></div>
          {status.text && <div className={`rounded-xl p-4 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{status.type === 'error' ? <WifiOff className="mr-2 inline" size={17}/> : <CheckCircle2 className="mr-2 inline" size={17}/>} {status.text}</div>}
        </div>
      </section>
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><b>Como funciona:</b> você configura a chave uma única vez como administrador. O assinante não vê a chave; quando usar o Professor, o backend usa a configuração central e envia a solicitação à OpenAI.</section>
    </div>
  );
}
