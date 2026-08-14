import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { Check, ChevronLeft, ChevronRight, CircleHelp, FileText, Home, MapPin, Plug, ShieldCheck, Sparkles, UserRound, Zap } from 'lucide-react';

type ClientItem = { id: string; name: string; segment: string };
type ProjectItem = { id: string; name: string; description: string; client: ClientItem; projectData?: string | null; designData?: string | null; plantData?: string | null };

type Room = { id: number; name: string; area: number; length: number; width: number };
type Point = { id: number; roomId: number; type: 'Iluminação' | 'TUG' | 'TUE'; equipment: string; qty: number; watts: number; voltage: 127 | 220; distance: number };
type WizardData = {
  identification: { name: string; description: string; propertyType: string; purpose: string; address: string; number: string; city: string; state: string };
  supply: { utility: string; city: string; voltage: string; phases: string; neutral: boolean; grounding: string; groundingExisting: string };
  rooms: Room[];
  points: Point[];
  criteria: { method: string; conductor: string; insulation: string; temperature: number; maxDrop: number };
  protections: { dr: boolean; drMa: number; dps: boolean; grounding: string };
};

const emptyData = (name = ''): WizardData => ({
  identification: { name, description: '', propertyType: 'Residencial', purpose: 'Residência unifamiliar', address: '', number: '', city: '', state: 'SP' },
  supply: { utility: 'CPFL Paulista', city: 'Itatiba', voltage: '127/220 V', phases: 'Bifásico', neutral: true, grounding: 'A verificar', groundingExisting: 'A verificar' },
  rooms: [],
  points: [],
  criteria: { method: 'B1 — eletroduto embutido', conductor: 'Cobre', insulation: 'PVC 70 °C', temperature: 30, maxDrop: 4 },
  protections: { dr: true, drMa: 30, dps: true, grounding: 'A verificar' },
});

const steps = [
  ['Identificação', UserRound, 'Cliente e dados do projeto'],
  ['Fornecimento', Zap, 'Concessionária e tensão'],
  ['Ambientes', Home, 'Cômodos da instalação'],
  ['Pontos e cargas', Plug, 'Pontos e equipamentos'],
  ['Critérios', FileText, 'Critérios de pré-dimensionamento'],
  ['Proteções', ShieldCheck, 'DR, DPS e aterramento'],
  ['Revisão', Check, 'Conferir antes de criar'],
];

export default function ProjectsPage() {
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clientId, setClientId] = useState('');
  const [data, setData] = useState<WizardData>(emptyData());
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const [cs, ps] = await Promise.all([apiFetch('/clients'), apiFetch('/projects')]);
      setClients(cs);
      setProjects(ps);
      if (cs[0]) setClientId(cs[0].id);
    } catch (e) { setMessage(`Erro ao carregar dados: ${(e as Error).message}`); }
  }

  const updateIdentification = (field: keyof WizardData['identification'], value: string) =>
    setData(d => ({ ...d, identification: { ...d.identification, [field]: value } }));
  const updateSupply = (field: keyof WizardData['supply'], value: string | boolean) =>
    setData(d => ({ ...d, supply: { ...d.supply, [field]: value } }));
  const updateCriteria = (field: keyof WizardData['criteria'], value: string | number) =>
    setData(d => ({ ...d, criteria: { ...d.criteria, [field]: value } }));
  const updateProtections = (field: keyof WizardData['protections'], value: string | boolean | number) =>
    setData(d => ({ ...d, protections: { ...d.protections, [field]: value } }));

  function addRoom() {
    const id = Date.now();
    setData(d => ({ ...d, rooms: [...d.rooms, { id, name: `Ambiente ${d.rooms.length + 1}`, area: 10, length: 4, width: 2.5 }] }));
  }
  function updateRoom(id: number, field: keyof Room, value: string) {
    setData(d => ({ ...d, rooms: d.rooms.map(r => r.id === id ? { ...r, [field]: field === 'name' ? value : Number(value) } : r) }));
  }
  function removeRoom(id: number) {
    setData(d => ({ ...d, rooms: d.rooms.filter(r => r.id !== id), points: d.points.filter(p => p.roomId !== id) }));
  }
  function addPoint() {
    const roomId = data.rooms[0]?.id;
    if (!roomId) { setMessage('Cadastre pelo menos um ambiente antes de adicionar pontos.'); return; }
    setData(d => ({ ...d, points: [...d.points, { id: Date.now(), roomId, type: 'TUG', equipment: 'Tomada de uso geral', qty: 1, watts: 100, voltage: 127, distance: 10 }] }));
  }
  function updatePoint(id: number, field: keyof Point, value: string) {
    setData(d => ({ ...d, points: d.points.map(p => p.id === id ? { ...p, [field]: ['qty','watts','distance'].includes(field) ? Number(value) : field === 'voltage' ? Number(value) : value } as Point : p) }));
  }
  function removePoint(id: number) {
    setData(d => ({ ...d, points: d.points.filter(p => p.id !== id) }));
  }

  function validateStep() {
    if (step === 0 && (!data.identification.name.trim() || !clientId)) return 'Informe o nome do projeto e selecione o cliente.';
    if (step === 2 && data.rooms.length === 0) return 'Cadastre pelo menos um ambiente.';
    if (step === 3 && data.points.some(p => !p.watts || !p.voltage)) return 'Todos os pontos precisam de potência e tensão.';
    return '';
  }

  function next() {
    const error = validateStep();
    if (error) { setMessage(error); return; }
    setMessage('');
    setStep(s => Math.min(steps.length - 1, s + 1));
  }

  async function createProject(event?: FormEvent) {
    event?.preventDefault();
    const error = validateStep();
    if (error) { setMessage(error); return; }
    if (!clientId) { setMessage('Selecione o cliente.'); return; }
    setSaving(true); setMessage('');
    try {
      const project = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: data.identification.name,
          description: data.identification.description,
          clientId,
          projectData: JSON.stringify(data),
        }),
      });
      setProjects(items => [project, ...items]);
      setMessage('Projeto criado. Planta, Projetista e Professor IA agora usam este mesmo projeto como fonte de dados.');
      setStep(6);
    } catch (e) {
      setMessage(`Erro ao criar projeto: ${(e as Error).message}`);
    } finally { setSaving(false); }
  }

  const selectedClient = clients.find(c => c.id === clientId);
  const totalLoad = useMemo(() => data.points.reduce((s, p) => s + p.qty * p.watts, 0), [data.points]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Novo projeto elétrico</h2>
        <p className="mt-2 text-sm text-slate-500">Cadastre os dados uma vez. Planta 2D, Projetista e Professor IA usarão o mesmo projeto.</p>
      </div>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

      <div className="grid gap-3 overflow-x-auto md:grid-cols-7">
        {steps.map(([label, Icon, subtitle], i) => (
          <button key={label as string} onClick={() => i <= step && setStep(i)} className={`min-w-[150px] rounded-2xl border p-3 text-left ${i === step ? 'border-blue-500 bg-blue-50' : i < step ? 'border-emerald-200 bg-emerald-50' : 'bg-white'}`}>
            <div className="flex items-center gap-2 text-sm font-bold"><Icon size={17} />{label as string}</div>
            <div className="mt-1 text-xs text-slate-500">{subtitle as string}</div>
          </button>
        ))}
      </div>

      <form onSubmit={createProject} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && <section>
          <Header icon={<UserRound />} title="Identificação" text="Dados que aparecerão no projeto, relatório e documentos." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Cliente *"><select value={clientId} onChange={e => setClientId(e.target.value)} className={input} required><option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Nome do projeto *"><input value={data.identification.name} onChange={e => updateIdentification('name', e.target.value)} className={input} placeholder="Residência João da Silva" required /></Field>
            <Field label="Tipo de imóvel"><select value={data.identification.propertyType} onChange={e => updateIdentification('propertyType', e.target.value)} className={input}><option>Residencial</option><option>Comercial</option><option>Industrial</option></select></Field>
            <Field label="Finalidade"><input value={data.identification.purpose} onChange={e => updateIdentification('purpose', e.target.value)} className={input} /></Field>
            <Field label="Endereço"><input value={data.identification.address} onChange={e => updateIdentification('address', e.target.value)} className={input} /></Field>
            <Field label="Número"><input value={data.identification.number} onChange={e => updateIdentification('number', e.target.value)} className={input} /></Field>
            <Field label="Cidade"><input value={data.identification.city} onChange={e => updateIdentification('city', e.target.value)} className={input} /></Field>
            <Field label="UF"><input value={data.identification.state} onChange={e => updateIdentification('state', e.target.value)} className={input} /></Field>
            <Field label="Descrição" wide><textarea value={data.identification.description} onChange={e => updateIdentification('description', e.target.value)} className={input} rows={3} /></Field>
          </div>
        </section>}

        {step === 1 && <section>
          <Header icon={<Zap />} title="Fornecimento de energia" text="Dados da concessionária. Confirme a condição específica da unidade antes da execução." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Concessionária"><input value={data.supply.utility} onChange={e => updateSupply('utility', e.target.value)} className={input} /></Field>
            <Field label="Cidade"><input value={data.supply.city} onChange={e => updateSupply('city', e.target.value)} className={input} /></Field>
            <Field label="Tensão"><select value={data.supply.voltage} onChange={e => updateSupply('voltage', e.target.value)} className={input}><option>127/220 V</option><option>220/127 V</option><option>220 V</option><option>380/220 V</option><option>A confirmar</option></select></Field>
            <Field label="Tipo de fornecimento"><select value={data.supply.phases} onChange={e => updateSupply('phases', e.target.value)} className={input}><option>Monofásico</option><option>Bifásico</option><option>Trifásico</option><option>A confirmar</option></select></Field>
            <Field label="Neutro"><select value={String(data.supply.neutral)} onChange={e => updateSupply('neutral', e.target.value === 'true')} className={input}><option value="true">Sim</option><option value="false">Não</option></select></Field>
            <Field label="Esquema de aterramento"><select value={data.supply.grounding} onChange={e => updateSupply('grounding', e.target.value)} className={input}><option>A verificar</option><option>TT</option><option>TN-S</option><option>TN-C-S</option></select></Field>
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"><CircleHelp className="mr-2 inline" size={17} />O ElectroCAD registra a informação fornecida, mas não presume a ligação definitiva da concessionária.</div>
        </section>}

        {step === 2 && <section>
          <Header icon={<Home />} title="Ambientes" text="Cadastre cada cômodo que fará parte da instalação. Esses dados serão usados pela planta 2D, pelo Projetista e pelo Professor IA." />
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <b>Como preencher:</b> informe o nome do cômodo, a área aproximada e, se souber, as dimensões internas. Se ainda não souber uma medida, deixe 0 e complete depois na planta.
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600"><tr>
                <th className="p-3">Ambiente <span title="Nome do cômodo">ⓘ</span></th>
                <th className="p-3">Área (m²) <span title="Área aproximada do piso">ⓘ</span></th>
                <th className="p-3">Comprimento (m) <span title="Medida interna de uma parede até a parede oposta">ⓘ</span></th>
                <th className="p-3">Largura (m) <span title="Medida interna perpendicular ao comprimento">ⓘ</span></th>
                <th className="p-3">Ação</th>
              </tr></thead>
              <tbody>{data.rooms.map(r => <tr key={r.id} className="border-t align-top">
                <td className="p-3"><input aria-label="Nome do ambiente" value={r.name} onChange={e => updateRoom(r.id, 'name', e.target.value)} className={smallInput} placeholder="Ex.: Sala" /><p className="mt-1 text-xs text-slate-400">Como o cômodo será identificado na planta.</p></td>
                <td className="p-3"><input aria-label="Área em metros quadrados" type="number" min="0" step="0.1" value={r.area} onChange={e => updateRoom(r.id, 'area', e.target.value)} className={smallInput} placeholder="Ex.: 18" /><p className="mt-1 text-xs text-slate-400">Área aproximada do piso.</p></td>
                <td className="p-3"><input aria-label="Comprimento em metros" type="number" min="0" step="0.01" value={r.length} onChange={e => updateRoom(r.id, 'length', e.target.value)} className={smallInput} placeholder="Ex.: 6" /><p className="mt-1 text-xs text-slate-400">Parede maior, em metros.</p></td>
                <td className="p-3"><input aria-label="Largura em metros" type="number" min="0" step="0.01" value={r.width} onChange={e => updateRoom(r.id, 'width', e.target.value)} className={smallInput} placeholder="Ex.: 3" /><p className="mt-1 text-xs text-slate-400">Parede perpendicular, em metros.</p></td>
                <td className="p-3"><button type="button" onClick={() => removeRoom(r.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Remover</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" onClick={addRoom} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white">+ Adicionar ambiente</button>
        </section>}

        {step === 3 && <section>
          <Header icon={<Plug />} title="Pontos e cargas" text="Cadastre equipamentos reais quando conhecidos. TUG genérica é apenas estimativa." />
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b text-left text-slate-500"><th>Ambiente</th><th>Tipo</th><th>Equipamento</th><th>Qtd.</th><th>W</th><th>V</th><th>Dist. m</th><th></th></tr></thead><tbody>{data.points.map(p => <tr key={p.id} className="border-b">
            <td className="py-2 pr-2"><select value={p.roomId} onChange={e => updatePoint(p.id, 'roomId', e.target.value)} className={smallInput}>{data.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></td>
            <td><select value={p.type} onChange={e => updatePoint(p.id, 'type', e.target.value)} className={smallInput}><option>Iluminação</option><option>TUG</option><option>TUE</option></select></td>
            <td><input value={p.equipment} onChange={e => updatePoint(p.id, 'equipment', e.target.value)} className={smallInput} /></td>
            <td><input type="number" min="1" value={p.qty} onChange={e => updatePoint(p.id, 'qty', e.target.value)} className={smallInput} /></td>
            <td><input type="number" min="1" value={p.watts} onChange={e => updatePoint(p.id, 'watts', e.target.value)} className={smallInput} /></td>
            <td><select value={p.voltage} onChange={e => updatePoint(p.id, 'voltage', e.target.value)} className={smallInput}><option value="127">127</option><option value="220">220</option></select></td>
            <td><input type="number" value={p.distance} onChange={e => updatePoint(p.id, 'distance', e.target.value)} className={smallInput} /></td>
            <td><button type="button" onClick={() => removePoint(p.id)} className="text-red-600">Excluir</button></td>
          </tr>)}</tbody></table></div>
          <button type="button" onClick={addPoint} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white">+ Adicionar ponto</button>
        </section>}

        {step === 4 && <section>
          <Header icon={<FileText />} title="Critérios de projeto" text="Configurações usadas como base para o pré-dimensionamento." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Método de instalação"><select value={data.criteria.method} onChange={e => updateCriteria('method', e.target.value)} className={input}><option>B1 — eletroduto embutido</option><option>B2 — eletroduto aparente</option><option>C — cabos em eletroduto</option><option>A confirmar</option></select></Field>
            <Field label="Condutor"><select value={data.criteria.conductor} onChange={e => updateCriteria('conductor', e.target.value)} className={input}><option>Cobre</option><option>Alumínio</option></select></Field>
            <Field label="Isolação"><select value={data.criteria.insulation} onChange={e => updateCriteria('insulation', e.target.value)} className={input}><option>PVC 70 °C</option><option>HEPR 90 °C</option><option>EPR 90 °C</option></select></Field>
            <Field label="Temperatura ambiente (°C)"><input type="number" value={data.criteria.temperature} onChange={e => updateCriteria('temperature', Number(e.target.value))} className={input} /></Field>
            <Field label="Queda de tensão máxima (%)"><input type="number" step="0.1" value={data.criteria.maxDrop} onChange={e => updateCriteria('maxDrop', Number(e.target.value))} className={input} /></Field>
          </div>
        </section>}

        {step === 5 && <section>
          <Header icon={<ShieldCheck />} title="Proteções" text="Registre as proteções previstas. A seleção final depende do projeto completo." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border p-4"><input type="checkbox" checked={data.protections.dr} onChange={e => updateProtections('dr', e.target.checked)} />DR</label>
            <Field label="Sensibilidade DR (mA)"><input type="number" value={data.protections.drMa} onChange={e => updateProtections('drMa', Number(e.target.value))} className={input} /></Field>
            <label className="flex items-center gap-3 rounded-2xl border p-4"><input type="checkbox" checked={data.protections.dps} onChange={e => updateProtections('dps', e.target.checked)} />DPS</label>
            <Field label="Aterramento"><select value={data.protections.grounding} onChange={e => updateProtections('grounding', e.target.value)} className={input}><option>A verificar</option><option>Existente</option><option>Novo</option></select></Field>
          </div>
        </section>}

        {step === 6 && <section>
          <Header icon={<Check />} title="Revisão do projeto" text="Confira os dados antes de criar o projeto central." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Summary title="Identificação"><b>{data.identification.name}</b><br />{selectedClient?.name || 'Sem cliente'}<br />{data.identification.city}/{data.identification.state}</Summary>
            <Summary title="Fornecimento">{data.supply.utility} • {data.supply.voltage} • {data.supply.phases}<br />Aterramento: {data.supply.grounding}</Summary>
            <Summary title="Instalação">{data.rooms.length} ambientes • {data.points.length} pontos<br />Carga cadastrada: {(totalLoad / 1000).toFixed(2)} kW</Summary>
            <Summary title="Proteções">DR: {data.protections.dr ? `${data.protections.drMa} mA` : 'Não previsto'} • DPS: {data.protections.dps ? 'Sim' : 'Não'}</Summary>
          </div>
          <button type="submit" disabled={saving} className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Criando...' : '✓ Criar projeto e preparar integração'}</button>
        </section>}

        <div className="mt-8 flex justify-between border-t pt-5">
          <button type="button" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))} className="rounded-xl border px-4 py-2.5 font-semibold disabled:opacity-40"><ChevronLeft className="mr-1 inline" size={17} />Voltar</button>
          {step < 6 && <button type="button" onClick={next} className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white">Continuar <ChevronRight className="ml-1 inline" size={17} /></button>}
        </div>
      </form>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">Projetos cadastrados</h3>
        <div className="mt-4 space-y-3">{projects.length === 0 ? <p className="text-sm text-slate-500">Nenhum projeto cadastrado ainda.</p> : projects.map(project => (
          <div key={project.id} className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="font-semibold">{project.name}</p><p className="text-sm text-slate-500">Cliente: {project.client.name}</p><p className="mt-1 text-xs text-slate-500">{project.description}</p></div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/planta?projectId=${encodeURIComponent(project.id)}`} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-blue-700">Planta</Link>
                <Link to={`/projetista?projectId=${encodeURIComponent(project.id)}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Projetista</Link>
                <Link to={`/professor?projectId=${encodeURIComponent(project.id)}`} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white">Professor IA</Link>
              </div>
            </div>
          </div>
        ))}</div>
      </section>
    </div>
  );
}

const input = 'mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500';
const smallInput = 'w-full rounded-xl border border-slate-200 px-2.5 py-2 outline-none focus:border-blue-500';
function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'block md:col-span-2' : 'block'}><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
function Header({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-700">{icon}</div><div><h3 className="text-xl font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div></div>;
}
function Summary({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6"><b className="block text-slate-900">{title}</b><div className="mt-1 text-slate-600">{children}</div></div>;
}
