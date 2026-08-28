import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calculator, FileText, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { calculateDimensioning, estimateServiceBudget, type CircuitInput, type DimensioningInput } from '../../services/electricalCalculator';

type Project = { id: string; name: string; description?: string; client?: { name: string }; projectData?: string | null; plantData?: string | null; designData?: string | null };
function parse(value?: string | null): any { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }
function asNumber(v: unknown, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

function buildCircuits(project: Project): CircuitInput[] {
  const plant = parse(project.plantData); const projectData = parse(project.projectData); const design = parse(project.designData);
  const source = Array.isArray(projectData.circuits) && projectData.circuits.length ? projectData : Array.isArray(design.circuits) ? design : plant;
  if (Array.isArray(source.circuits) && source.circuits.length) return source.circuits.map((c: any, i: number) => ({
    id: String(c.id || `C${i + 1}`), name: String(c.name || c.description || `Circuito ${i + 1}`), type: String(c.type || 'TUG'),
    rooms: Array.isArray(c.rooms) ? c.rooms.map(String) : [],
    points: Array.isArray(c.points) ? c.points.map((p: any) => ({ qty: Math.max(1, asNumber(p.qty, 1)), unit_power_W: asNumber(p.unit_power_W ?? p.watts, 100), voltage_V: asNumber(p.voltage_V ?? p.voltage, 127), description: p.description })) : [],
    route_length_m: asNumber(c.route_length_m ?? c.distance, 10), proposed_conductor_mm2: c.proposed_conductor_mm2 ? asNumber(c.proposed_conductor_mm2) : null,
    proposed_breaker_A: c.proposed_breaker_A ? asNumber(c.proposed_breaker_A) : null,
    motor: c.motor ? { power_kW: asNumber(c.motor.power_kW), voltage_V: asNumber(c.motor.voltage_V, 220), phases: Number(c.motor.phases) === 3 ? 3 : 1, efficiency: asNumber(c.motor.efficiency, 0.9), power_factor: asNumber(c.motor.power_factor, 0.85), service_factor: c.motor.service_factor ? asNumber(c.motor.service_factor) : null, lockedRotorCurrent_A: c.motor.lockedRotorCurrent_A ? asNumber(c.motor.lockedRotorCurrent_A) : null, startingCurrentFactor: c.motor.startingCurrentFactor ? asNumber(c.motor.startingCurrentFactor, 6) : 6 } : null,
  }));
  const points = Array.isArray(source.points) ? source.points : [];
  const groups = new Map<string, any[]>();
  points.forEach((p: any) => { const key = String(p.circuitId || p.circuit || p.kind || p.type || 'TUG'); if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(p); });
  return [...groups.entries()].map(([key, items], i) => ({ id: key.startsWith('C') ? key : `C${i + 1}`, name: key === 'Luz' || key === 'Iluminação' ? `C${i + 1} Iluminação` : `C${i + 1} ${key}`, type: key, rooms: [...new Set(items.map(p => String(p.roomName || p.room || 'Ambiente não informado')))], points: items.map(p => ({ qty: Math.max(1, asNumber(p.qty, 1)), unit_power_W: asNumber(p.unit_power_W ?? p.watts, 100), voltage_V: asNumber(p.voltage_V ?? p.voltage, 127), description: p.description || p.equipment })), route_length_m: Math.max(...items.map(p => asNumber(p.route_length_m ?? p.distance, 10)), 10) }));
}

export default function DimensioningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProjectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState<Project[]>([]); const [projectId, setProjectId] = useState(requestedProjectId);
  const [voltageSystem, setVoltageSystem] = useState('127/220 V'); const [phases, setPhases] = useState('Bifásico'); const [grounding, setGrounding] = useState('TN-C-S'); const [mainBreaker, setMainBreaker] = useState('40'); const [pf, setPf] = useState('1'); const [dropLimit, setDropLimit] = useState('4'); const [ambient, setAmbient] = useState('30');
  const [rccbRequired, setRccbRequired] = useState(true); const [rccbSensitivity, setRccbSensitivity] = useState('30');
  const [groupingFactor, setGroupingFactor] = useState('1'); const [temperatureFactor, setTemperatureFactor] = useState('1');
  const [result, setResult] = useState<any>(null); const [budget, setBudget] = useState<any>(null); const [message, setMessage] = useState('Selecione o projeto correto para iniciar o dimensionamento e o orçamento.');

  useEffect(() => {
    apiFetch('/projects').then((r: any) => {
      const list = Array.isArray(r) ? r : r?.projects || r?.items || [];
      setProjects(list);
      const id = requestedProjectId;
      setProjectId(id);
      const p = list.find((x: Project) => String(x.id) === String(id));
      if (p) setMessage(`Projeto selecionado: ${p.name}. O dimensionamento e o orçamento serão calculados somente para este projeto.`);
      else if (id) { setResult(null); setBudget(null); setMessage('O projeto informado não foi encontrado. Selecione um projeto válido na lista.'); }
      else { setResult(null); setBudget(null); setMessage('Selecione o projeto correto para iniciar o dimensionamento e o orçamento.'); }
    }).catch((e: Error) => setMessage(e.message));
  }, [requestedProjectId]);

  const project = projects.find(p => String(p.id) === String(projectId));
  const circuits = useMemo(() => project ? buildCircuits(project) : [], [project]);
  const stats = useMemo(() => { const plant = parse(project?.plantData); const rooms = Array.isArray(plant.rooms) ? plant.rooms.length : 0; const points = Array.isArray(plant.points) ? plant.points.length : circuits.reduce((s, c) => s + c.points.reduce((x, p) => x + p.qty, 0), 0); return { rooms, points, circuits: circuits.length }; }, [project, circuits]);

  function handleProjectChange(id: string) {
    setResult(null); setBudget(null); setProjectId(id);
    if (id) setSearchParams({ projectId: id }); else setSearchParams({});
    const selected = projects.find(p => String(p.id) === String(id));
    setMessage(selected ? `Projeto selecionado: ${selected.name}. Confira os dados antes de calcular.` : 'Selecione o projeto correto para iniciar o dimensionamento e o orçamento.');
  }

  function run() {
    if (!project) { setMessage('Selecione um projeto válido antes de calcular.'); return; }
    if (!circuits.length) { setMessage('O projeto selecionado ainda não possui circuitos/pontos suficientes para o dimensionamento.'); return; }
    const input: DimensioningInput = {
      name: project.name, address: '', supply: { voltage_system: voltageSystem, phases, neutral: true, grounding_type: grounding }, main_breaker: asNumber(mainBreaker, 40), ambient_temperature_c: asNumber(ambient, 30),
      criteria: { installation_method: 'B1 — eletroduto embutido', insulation: 'PVC 70°C', max_voltage_drop_percent: asNumber(dropLimit, 4), power_factor_assumed: asNumber(pf, 1), grouping_correction_factor: asNumber(groupingFactor, 1), temperature_correction_factor: asNumber(temperatureFactor, 1) },
      requirements: { rccbs: { required: rccbRequired, sensitivity_mA: asNumber(rccbSensitivity, 30) } }, circuits,
    };
    setResult(calculateDimensioning(input));
    setBudget(estimateServiceBudget({ rooms: stats.rooms, points: stats.points, circuits: stats.circuits, hasPlant: stats.rooms > 0, hasDimensioning: true, hasUnifilar: false }));
    setMessage(`Cálculo concluído para o projeto “${project.name}”. Materiais foram quantificados sem preços; o orçamento considera somente mão de obra/serviço.`);
  }

  return <div className="mx-auto max-w-6xl space-y-5 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link to={projectId ? `/projetista?projectId=${encodeURIComponent(projectId)}` : '/projetista'} className="text-sm text-slate-500"><ArrowLeft size={15} className="mr-1 inline"/>Voltar ao projetista</Link><h2 className="mt-1 text-3xl font-bold text-slate-900">Dimensionamento e orçamento</h2><p className="mt-1 text-sm text-slate-500">Motor preliminar baseado nas condições informadas, com materiais por quantidade/especificação e orçamento somente de mão de obra.</p></div><button onClick={run} disabled={!project || !circuits.length} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Calculator size={17} className="mr-2 inline"/>Calcular projeto selecionado</button></div>

    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"><label className="text-sm font-bold text-slate-800">Projeto para dimensionar e orçar<select value={projectId} onChange={e => handleProjectChange(e.target.value)} className="mt-2 w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-blue-600"><option value="">Selecione um projeto...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.client?.name ? ` — ${p.client.name}` : ''}</option>)}</select></label>{project ? <div className="rounded-xl bg-white px-4 py-3 text-sm"><div className="font-semibold text-slate-900">Projeto ativo</div><div className="text-slate-600">{project.name}{project.client?.name ? ` · Cliente: ${project.client.name}` : ''}</div></div> : <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Selecione um projeto antes de calcular.</div>}</div></section>

    {message && <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

    <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-bold">Dados do pré-dimensionamento</h3><div className="mt-4 grid gap-4 md:grid-cols-4">
      <label className="text-sm font-medium">Projeto<input value={project?.name || ''} readOnly className="mt-1 w-full rounded-xl border bg-slate-100 px-3 py-2 text-slate-700"/></label><label className="text-sm font-medium">Sistema<input value={voltageSystem} onChange={e => setVoltageSystem(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Fases<input value={phases} onChange={e => setPhases(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Aterramento<input value={grounding} onChange={e => setGrounding(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Disjuntor geral (A)<input value={mainBreaker} onChange={e => setMainBreaker(e.target.value)} type="number" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Fator de potência<input value={pf} onChange={e => setPf(e.target.value)} type="number" step="0.01" min="0.8" max="1" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Queda máxima (%)<input value={dropLimit} onChange={e => setDropLimit(e.target.value)} type="number" step="0.1" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Temperatura ambiente (°C)<input value={ambient} onChange={e => setAmbient(e.target.value)} type="number" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Fator de temperatura<input value={temperatureFactor} onChange={e => setTemperatureFactor(e.target.value)} type="number" step="0.01" min="0.1" max="1" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="text-sm font-medium">Fator de agrupamento<input value={groupingFactor} onChange={e => setGroupingFactor(e.target.value)} type="number" step="0.01" min="0.1" max="1" className="mt-1 w-full rounded-xl border px-3 py-2"/></label><label className="flex items-center gap-2 pt-7 text-sm font-medium"><input type="checkbox" checked={rccbRequired} onChange={e => setRccbRequired(e.target.checked)} /> DR 30 mA</label>{rccbRequired && <label className="text-sm font-medium">Sensibilidade DR (mA)<input value={rccbSensitivity} onChange={e => setRccbSensitivity(e.target.value)} type="number" className="mt-1 w-full rounded-xl border px-3 py-2"/></label>}
    </div></section>
    {result && <>
      <section className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Potência total</div><div className="mt-1 text-2xl font-bold">{result.totalPower_kW} kW</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Corrente estimada</div><div className="mt-1 text-2xl font-bold">{result.totalCurrent_A} A</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Circuitos</div><div className="mt-1 text-2xl font-bold">{result.circuits.length}</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-sm text-slate-500">Mão de obra sugerida</div><div className="mt-1 text-2xl font-bold">R$ {budget?.suggested.toFixed(2)}</div></div></section>
      <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-xl font-bold"><ShieldCheck size={19} className="mr-2 inline"/>Diagnóstico</h3><p className="mt-2">{result.diagnosis}</p><div className="mt-4 space-y-4">{result.circuits.map((c: any) => <div key={c.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><b>{c.id} — {c.name}</b><span>{c.ok ? '✅ OK' : '⚠️ Revisar'}</span></div><div className="mt-2 grid gap-2 text-sm md:grid-cols-6"><span>P: <b>{c.totalPower_W} W</b></span><span>Ib: <b>{c.ib_A} A</b></span><span>Ib projeto: <b>{c.designCurrent_A} A</b></span><span>Disj.: <b>{c.breaker_A ?? '—'} A</b></span><span>Condutor: <b>{c.conductor_mm2 ?? '—'} mm²</b></span><span>Iz: <b>{c.iz_A ?? '—'} A</b></span></div><div className="mt-2 text-sm">ΔV: <b>{c.voltageDrop_V ?? '—'} V ({c.voltageDropPercent ?? '—'}%)</b> · Curva: <b>{c.breakerCurve}</b>{c.motor && <> · Partida: <b>{c.startingCurrent_A} A / {c.startingVoltageDropPercent}%</b></>}</div><div className="mt-3 text-sm"><b>Cálculos/Justificativas:</b> {c.motor ? `motor ${c.motor.power_kW} kW, ${c.motor.phases} fase(s), η=${c.motor.efficiency}, fp=${c.motor.powerFactor}; Ib = ${c.ib_A} A; Ib projeto = ${c.designCurrent_A} A.` : `P = ${c.totalPower_W} W; Ib = P/(V×fp) = ${c.ib_A} A.`} Queda de tensão = {c.voltageDrop_V ?? '—'} V ({c.voltageDropPercent ?? '—'}%).</div>{c.alerts.length > 0 && <div className="mt-3 text-sm text-amber-800"><b>⚠️ Alertas:</b><ul className="ml-5 list-disc">{c.alerts.map((a: string) => <li key={a}>{a}</li>)}</ul></div>}</div>)}</div></section>
      <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-xl font-bold"><Wrench size={19} className="mr-2 inline"/>Lista de materiais — sem preços</h3><p className="mt-1 text-sm text-slate-500">O sistema calcula quantidades e especificações. O preço deve ser consultado na loja/fornecedor escolhido.</p><div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Item</th><th className="px-3 py-2">Especificação</th><th className="px-3 py-2">Qtd.</th><th className="px-3 py-2">Un.</th><th className="px-3 py-2">Base</th></tr></thead><tbody>{result.materialSchedule.map((m: any, i: number) => <tr key={`${m.item}-${i}`} className="border-b last:border-0"><td className="px-3 py-2">{m.category}</td><td className="px-3 py-2 font-semibold">{m.item}</td><td className="px-3 py-2">{m.specification}</td><td className="px-3 py-2">{m.quantity}</td><td className="px-3 py-2">{m.unit}</td><td className="px-3 py-2 text-slate-500">{m.basis}</td></tr>)}</tbody></table></div></section>
      <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><h3 className="font-bold"><FileText size={18} className="mr-2 inline"/>Orçamento — somente mão de obra</h3><p className="mt-2 text-3xl font-bold">R$ {budget.suggested.toFixed(2)}</p><p className="text-sm text-slate-500">Faixa sugerida: R$ {budget.rangeMin.toFixed(2)} a R$ {budget.rangeMax.toFixed(2)}</p><ul className="mt-3 space-y-1 text-sm">{Object.entries(budget.breakdown).map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><b>R$ {Number(v).toFixed(2)}</b></li>)}</ul><p className="mt-4 text-xs text-slate-500">{budget.note}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold">⚠️ Próximos passos</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{result.alerts.map((a: string) => <li key={a}>{a}</li>)}</ul><p className="mt-4 text-xs text-slate-600">{result.disclaimer}</p></div></section>
    </>}
  </div>;
}
