import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { fetchProfile, setStoredUser } from '../../services/auth';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<any>(null);
  const [form, setForm] = useState({ username: '', email: '', companyName: '', phone: '', whatsapp: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, a] = await Promise.all([fetchProfile(), apiFetch('/subscriptions/me')]);
    setProfile(p);
    setAccess(a);
    setForm({ username: p.username || '', email: p.email || '', companyName: p.companyName || '', phone: p.phone || '', whatsapp: p.whatsapp || '' });
  };

  useEffect(() => { load().catch((e) => setMessage(e.message)); }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { const updated = await apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(form) }); setProfile(updated); setStoredUser(updated); setMessage('✓ Perfil atualizado com sucesso.'); }
    catch (e) { setMessage(`Erro: ${(e as Error).message}`); } finally { setSaving(false); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { await apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify(passwords) }); setPasswords({ currentPassword: '', newPassword: '' }); setMessage('✓ Senha alterada com sucesso.'); }
    catch (e) { setMessage(`Erro: ${(e as Error).message}`); } finally { setSaving(false); }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura? O acesso ao plano pago será encerrado conforme o cancelamento no Asaas.')) return;
    setSaving(true); setMessage('');
    try { await apiFetch('/subscriptions/cancel-my', { method: 'POST' }); await load(); setMessage('✓ Assinatura cancelada.'); }
    catch (e) { setMessage(`Erro: ${(e as Error).message}`); } finally { setSaving(false); }
  };

  if (!profile) return <div className="p-8 text-slate-500">Carregando perfil...</div>;

  const planLabel = access?.plan || 'Teste gratuito';
  const statusLabel = access?.subscriptionStatus === 'ACTIVE' ? 'Ativo' : access?.subscriptionStatus === 'CANCELLED' ? 'Cancelado' : access?.subscriptionStatus === 'SUSPENDED' ? 'Suspenso' : access?.subscriptionStatus === 'PENDING' ? 'Aguardando pagamento' : 'Teste gratuito';

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div><h2 className="text-3xl font-bold text-slate-900">Meu perfil</h2><p className="mt-2 text-sm text-slate-500">Seus dados pessoais, empresa, contato, senha e assinatura.</p></div>
      {message && <div className={`rounded-2xl border px-4 py-3 text-sm ${message.startsWith('Erro') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Minha assinatura</p><h3 className="mt-1 text-2xl font-bold text-slate-900">Plano {planLabel}</h3><p className="mt-1 text-sm text-slate-500">Status: <b>{statusLabel}</b></p></div>
          <div className="text-right"><p className="text-sm text-slate-500">Teste gratuito</p><b className="text-lg text-slate-900">{access?.daysRemaining ?? 0} dia(s) restante(s)</b></div>
        </div>
        {access?.hasActiveSubscription && <button disabled={saving} onClick={cancelSubscription} className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">Cancelar assinatura</button>}
        {!access?.hasActiveSubscription && <Link to="/assinar" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Ver planos</Link>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Dados pessoais e empresa</h3>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium">Nome completo<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" required /></label>
            <label className="text-sm font-medium">E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" required /></label>
            <label className="text-sm font-medium">Empresa<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
            <label className="text-sm font-medium">Telefone / celular<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
            <label className="text-sm font-medium">WhatsApp<input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
          </div>
          <button disabled={saving} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Salvar dados</button>
        </form>

        <form onSubmit={changePassword} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">Alterar senha</h3>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium">Senha atual<input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" required /></label>
            <label className="text-sm font-medium">Nova senha<input type="password" minLength={6} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="mt-1 w-full rounded-xl border px-4 py-3" required /></label>
          </div>
          <button disabled={saving} className="mt-5 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">Alterar senha</button>
        </form>
      </div>
    </div>
  );
}
