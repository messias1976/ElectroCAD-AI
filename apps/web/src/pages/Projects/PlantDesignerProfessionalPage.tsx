import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, BrainCircuit, FileText, Lightbulb, MousePointer2, Printer, Save, Square as WindowIcon, DoorOpen, Zap, Maximize2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';

type Kind = 'Luz' | 'TUG' | 'TUE';
type Tool = 'select' | 'room' | 'door' | 'window' | Kind;
type Opening = { id: string; side: 'top' | 'right' | 'bottom' | 'left'; offset: number; width: number };
type Room = { id: number; name: string; x: number; y: number; w: number; h: number; doors: Opening[]; windows: Opening[] };
type Point = { id: number; sourceId: string; roomId: number; kind: Kind; x: number; y: number; watts: number; voltage: 127 | 220; label: string; distance: number; description: string };
type Project = { id: string; name: string; description: string; client?: { id: string; name: string }; projectData?: string | null; plantData?: string | null; designData?: string | null };

const palette: Record<Kind, { label: string; color: string; icon: typeof Lightbulb }> = {
  Luz: { label: 'Iluminação', color: '#facc15', icon: Lightbulb },
  TUG: { label: 'TUG', color: '#60a5fa', icon: MousePointer2 },
  TUE: { label: 'TUE', color: '#fb923c', icon: Zap },
};

function parse(value?: string | null): Record<string, any> { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }
function numericId(value: unknown, fallback: number) { const n = Number(value); if (Number.isFinite(n) && n > 0) return n; let h = 0; for (const c of String(value ?? fallback)) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return Math.abs(h || fallback) + 1000; }
function kindOf(value: unknown): Kind { return value === 'Luz' || value === 'Iluminação' ? 'Luz' : value === 'TUE' ? 'TUE' : 'TUG'; }
function roomAt(rooms: Room[], x: number, y: number) { return rooms.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); }
function nearestRoom(rooms: Room[], x: number, y: number) { return rooms.reduce<Room | undefined>((best, room) => { const cx = room.x + room.w / 2; const cy = room.y + room.h / 2; if (!best) return room; return Math.hypot(x - cx, y - cy) < Math.hypot(x - (best.x + best.w / 2), y - (best.y + best.h / 2)) ? room : best; }, undefined); }

function normalizeRooms(data: any): Room[] {
  const source = Array.isArray(data?.rooms) ? data.rooms : [];
  return source.map((r: any, i: number) => ({
    id: numericId(r.id, i + 1), name: String(r.name || `Ambiente ${i + 1}`),
    x: Number.isFinite(Number(r.x)) ? Number(r.x) : 40 + (i % 3) * 260,
    y: Number.isFinite(Number(r.y)) ? Number(r.y) : 40 + Math.floor(i / 3) * 210,
    w: Math.max(150, Number(r.w) || Number(r.length || 4) * 55),
    h: Math.max(110, Number(r.h) || Number(r.width || 2.8) * 55),
    doors: Array.isArray(r.doors) ? r.doors : [], windows: Array.isArray(r.windows) ? r.windows : [],
  }));
}

function expandPoints(data: any, rooms: Room[]): Point[] {
  const source = Array.isArray(data?.points) ? data.points : [];
  const result: Point[] = [];
  source.forEach((p: any, index: number) => {
    const qty = Math.max(1, Math.round(Number(p.qty) || 1));
    const roomId = numericId(p.roomId, rooms[0]?.id || 1);
    const room = rooms.find(r => r.id === roomId) || rooms[0];
    const baseX = Number.isFinite(Number(p.x)) ? Number(p.x) : (room ? room.x + room.w / 2 : 100);
    const baseY = Number.isFinite(Number(p.y)) ? Number(p.y) : (room ? room.y + room.h / 2 : 100);
    const kind = kindOf(p.kind || p.type);
    for (let i = 0; i < qty; i++) {
      const angle = qty === 1 ? 0 : (Math.PI * 2 * i) / qty;
      const radius = qty === 1 ? 0 : Math.min(38, Math.max(20, Math.min(room?.w || 80, room?.h || 80) / 5));
      const id = numericId(`${p.sourceId || p.id || index}-${i + 1}`, index * 100 + i + 1);
      const sourceId = `${String(p.sourceId || p.id || `p${index + 1}`)}#${i + 1}`;
      const prefix = kind === 'Luz' ? 'L' : kind === 'TUG' ? 'T' : 'E';
      result.push({ id, sourceId, roomId: room?.id || 1, kind, x: baseX + Math.cos(angle) * radius, y: baseY + Math.sin(angle) * radius, watts: Number(p.watts) || 100, voltage: Number(p.voltage) === 220 ? 220 : 127, label: qty > 1 ? `${prefix}${index + 1}.${i + 1}` : String(p.label || `${prefix}${index + 1}`), distance: Number(p.distance) || 10, description: String(p.description || p.equipment || 'Ponto elétrico') });
    }
  });
  return result;
}

function loadPlant(project: Project) {
  const plant = parse(project.plantData);
  const projectData = parse(project.projectData);
  const design = parse(project.designData);
  const source = Array.isArray(plant.rooms) && plant.rooms.length ? plant : Array.isArray(projectData.rooms) ? projectData : design;
  const rooms = normalizeRooms(source);
  const points = expandPoints(source, rooms);
  return { rooms, points };
}

export default function PlantDesignerProfessionalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ type: 'point' | 'room'; id: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'editor' | 'professor'>('editor');
  const [message, setMessage] = useState('Arraste os pontos e ambientes para organizar a planta.');

  const currentProject = projects.find(p => String(p.id) === String(projectId));
  const bounds = useMemo(() => ({ width: Math.max(900, ...rooms.map(r => r.x + r.w + 80)), height: Math.max(600, ...rooms.map(r => r.y + r.h + 80)) }), [rooms]);
  const stats = useMemo(() => ({ points: points.length, rooms: rooms.length, tug: points.filter(p => p.kind === 'TUG').length, tue: points.filter(p => p.kind === 'TUE').length, light: points.filter(p => p.kind === 'Luz').length, watts: points.reduce((sum, p) => sum + p.watts, 0) }), [points]);

  useEffect(() => { void loadProjects(); }, []);
  async function loadProjects() {
    try {
      const response = await apiFetch('/projects');
      const list: Project[] = Array.isArray(response) ? response : response?.projects || response?.items || [];
      setProjects(list);
      const wanted = searchParams.get('projectId');
      const id = wanted && list.some(p => String(p.id) === String(wanted)) ? wanted : list[0]?.id || '';
      if (id) { setProjectId(String(id)); setSearchParams({ projectId: String(id) }, { replace: true }); loadProject(list.find(p => String(p.id) === String(id))); }
    } catch (e) { setMessage(`Erro ao carregar projetos: ${(e as Error).message}`); }
  }
  function loadProject(project?: Project) { if (!project) return; const loaded = loadPlant(project); setRooms(loaded.rooms); setPoints(loaded.points); setSelected(null); setMessage(`Projeto "${project.name}" carregado: ${loaded.rooms.length} ambientes e ${loaded.points.length} pontos visíveis.`); }
  function selectProject(id: string) { setProjectId(id); setSearchParams({ projectId: id }); loadProject(projects.find(p => String(p.id) === String(id))); }
  function svgPoint(e: ReactPointerEvent<SVGSVGElement>) { const rect = e.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(bounds.width, ((e.clientX - rect.left) / rect.width) * bounds.width)), y: Math.max(0, Math.min(bounds.height, ((e.clientY - rect.top) / rect.height) * bounds.height)) }; }
  function move(e: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return; const p = svgPoint(e);
    if (drag.type === 'point') { const room = roomAt(rooms, p.x, p.y); setPoints(a => a.map(x => x.id === drag.id ? { ...x, x: p.x, y: p.y, roomId: room?.id || x.roomId } : x)); }
    else { const room = rooms.find(r => r.id === drag.id); if (!room) return; const nx = Math.max(10, Math.min(bounds.width - room.w - 10, p.x - room.w / 2)); const ny = Math.max(10, Math.min(bounds.height - room.h - 10, p.y - room.h / 2)); const dx = nx - room.x; const dy = ny - room.y; setRooms(a => a.map(r => r.id === room.id ? { ...r, x: nx, y: ny } : r)); setPoints(a => a.map(pt => pt.roomId === room.id ? { ...pt, x: pt.x + dx, y: pt.y + dy } : pt)); }
  }
  function finishDrag() { if (drag) setMessage('Posição atualizada. Clique em Salvar para gravar.'); setDrag(null); }
  function addPoint(kind: Kind, x: number, y: number) { const room = roomAt(rooms, x, y); if (!room) { setMessage('Solte o ponto dentro de um ambiente.'); return; } const n = points.filter(p => p.kind === kind).length + 1; const id = numericId(`new-${Date.now()}-${n}`, points.length + n); const prefix = kind === 'Luz' ? 'L' : kind === 'TUG' ? 'T' : 'E'; setPoints(a => [...a, { id, sourceId: `new-${id}`, roomId: room.id, kind, x, y, watts: kind === 'TUE' ? 1500 : 100, voltage: kind === 'TUE' ? 220 : 127, label: `${prefix}${n}`, distance: 10, description: palette[kind].label }]); setSelected(id); setMessage(`${palette[kind].label} criado em ${room.name}.`); }
  function addRoom(x: number, y: number) { const id = numericId(`room-${Date.now()}`, rooms.length + 1); const r: Room = { id, name: `Ambiente ${rooms.length + 1}`, x: Math.max(10, x - 90), y: Math.max(10, y - 65), w: 180, h: 130, doors: [], windows: [] }; setRooms(a => [...a, r]); setMessage('Novo ambiente criado.'); }
  function addOpening(type: 'door' | 'window', x: number, y: number) { const room = nearestRoom(rooms, x, y); if (!room) return; const side = Math.abs(x - room.x) < Math.abs(x - (room.x + room.w)) ? 'left' : Math.abs(x - (room.x + room.w)) < Math.abs(y - room.y) ? 'right' : Math.abs(y - room.y) < Math.abs(y - (room.y + room.h)) ? 'top' : 'bottom'; const horizontal = side === 'top' || side === 'bottom'; const span = horizontal ? room.w : room.h; const along = horizontal ? x - room.x : y - room.y; const opening: Opening = { id: `${type}-${Date.now()}`, side, offset: Math.max(0.08, Math.min(0.92, along / span)), width: type === 'door' ? 70 : 100 }; const key = type === 'door' ? 'doors' : 'windows'; setRooms(a => a.map(r => r.id === room.id ? { ...r, [key]: [...r[key], opening] } : r)); setMessage(`${type === 'door' ? 'Porta' : 'Janela'} criada em ${room.name}.`); }
  function canvasAction(e: ReactPointerEvent<SVGSVGElement>) { const p = svgPoint(e); if (tool === 'Luz' || tool === 'TUG' || tool === 'TUE') addPoint(tool, p.x, p.y); else if (tool === 'room') addRoom(p.x, p.y); else if (tool === 'door' || tool === 'window') addOpening(tool, p.x, p.y); }
  async function save() {
    if (!currentProject) { setMessage('Selecione um projeto.'); return; }
    const roomsData = rooms.map(r => ({ id: r.id, name: r.name, x: r.x, y: r.y, w: r.w, h: r.h, length: Number((r.w / 55).toFixed(2)), width: Number((r.h / 55).toFixed(2)), area: Number(((r.w * r.h) / 3025).toFixed(2)), doors: r.doors, windows: r.windows }));
    const pointsData = points.map(p => ({ id: p.sourceId, sourceId: p.sourceId, roomId: p.roomId, type: p.kind === 'Luz' ? 'Iluminação' : p.kind, kind: p.kind, qty: 1, watts: p.watts, voltage: p.voltage, distance: p.distance, description: p.description, equipment: p.description, x: p.x, y: p.y, label: p.label }));
    const existing = parse(currentProject.projectData); const projectData = JSON.stringify({ ...existing, rooms: roomsData, points: pointsData, source: 'plant-editor-professional', updatedAt: new Date().toISOString() });
    const plantData = JSON.stringify({ rooms: roomsData, points: pointsData, source: 'plant-editor-professional', savedAt: new Date().toISOString() });
    const designData = JSON.stringify({ project: { name: currentProject.name, client: currentProject.client?.name || '' }, rooms: roomsData, points: pointsData, generated: false, savedAt: new Date().toISOString(), source: 'plant-editor-professional' });
    try { await apiFetch(`/projects/${currentProject.id}`, { method: 'PUT', body: JSON.stringify({ projectData, plantData, designData }) }); setProjects(a => a.map(p => p.id === currentProject.id ? { ...p, projectData, plantData, designData } : p)); setMessage(`Salvo com sucesso: ${rooms.length} ambientes e ${points.length} pontos.`); } catch (e) { setMessage(`Erro ao salvar: ${(e as Error).message}`); }
  }
  function print() { window.print(); }
      return (
        <div className="plant-professional min-h-full space-y-4 pb-8 text-left">

           <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">
             {message}
           </div>

    {/* restante da página */} 
     <style>{`@media print{.plant-no-print{display:none!important}.plant-print{display:block!important}.plant-canvas-wrap{overflow:visible!important}.plant-canvas{width:100%!important;height:auto!important;min-width:0!important;box-shadow:none!important}.plant-tabs{display:none!important}.plant-print-block{break-inside:avoid;page-break-inside:avoid}body{background:#fff!important}@page{size:A4 portrait;margin:8mm}} .plant-canvas{background:#fff}`}</style>
    <div className="plant-no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
      <div><Link to="/projetista" className="text-sm text-slate-500"><ArrowLeft size={15} className="mr-1 inline"/>Projetista</Link><h2 className="mt-1 text-2xl font-bold text-slate-900">Editor de Planta 2D</h2><p className="text-sm text-slate-500">Arraste e solte pontos e ambientes. A planta se ajusta automaticamente ao projeto.</p></div>
      <div className="flex flex-wrap gap-2"><select value={projectId} onChange={e => selectProject(e.target.value)} className="rounded-xl border px-3 py-2 font-semibold"><option value="">Selecionar projeto</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button onClick={() => void save()} className="rounded-xl border px-4 py-2 font-semibold"><Save size={16} className="mr-1 inline"/>Salvar</button><button onClick={print} className="rounded-xl border px-4 py-2 font-semibold"><Printer size={16} className="mr-1 inline"/>Imprimir</button><Link to={`/professor?projectId=${encodeURIComponent(projectId)}`} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white"><BrainCircuit size={16} className="mr-1 inline"/>Professor IA</Link></div>
    </div>
    <div className="plant-no-print grid gap-3 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border bg-white p-3 shadow-sm"><div className="mb-3 font-bold">Ferramentas</div><div className="grid gap-2">{([['select','Selecionar',MousePointer2],['room','Ambiente',Maximize2],['door','Porta',DoorOpen],['window','Janela',WindowIcon],['Luz','Iluminação',Lightbulb],['TUG','TUG',MousePointer2],['TUE','TUE',Zap]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setTool(id)} className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${tool === id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-slate-50'}`}><Icon size={16} className="mr-2 inline"/>{label}</button>)}</div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Selecione uma ferramenta e clique na planta, ou selecione um ponto/ambiente e arraste. O mesmo gesto funciona com mouse e toque.</div></aside>
      <div className="plant-canvas-wrap overflow-auto rounded-2xl border bg-slate-100 p-3"><svg className="plant-canvas min-w-[720px] rounded-xl border bg-white" viewBox={`0 0 ${bounds.width} ${bounds.height}`} width="100%" preserveAspectRatio="xMinYMin meet" style={{ touchAction: 'none', userSelect: 'none' }} onPointerMove={move} onPointerUp={finishDrag} onPointerCancel={finishDrag} onPointerDown={e => { if (tool !== 'select') canvasAction(e); }}>
        <defs><pattern id="plant-grid-pro" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e2e8f0"/></pattern></defs><rect width={bounds.width} height={bounds.height} fill="url(#plant-grid-pro)"/>
        {rooms.map(r => <g key={r.id} onPointerDown={e => { if (tool !== 'select') return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); setDrag({ type: 'room', id: r.id }); }} className="cursor-move"><rect x={r.x} y={r.y} width={r.w} height={r.h} rx="3" fill="#f8fafc" stroke="#334155" strokeWidth="3"/><text x={r.x + 12} y={r.y + 24} fontSize="14" fontWeight="700" fill="#0f172a">{r.name}</text><text x={r.x + 12} y={r.y + 41} fontSize="9" fill="#64748b">{(r.w / 55).toFixed(2)} × {(r.h / 55).toFixed(2)} m</text></g>)}
        {points.map(p => { const cfg = palette[p.kind]; const isSelected = selected === p.id; return <g key={p.id} onPointerDown={e => { e.stopPropagation(); if (tool !== 'select') return; e.currentTarget.setPointerCapture(e.pointerId); setSelected(p.id); setDrag({ type: 'point', id: p.id }); setMessage(`Movendo ${p.label}`); }} className="cursor-grab"><circle cx={p.x} cy={p.y} r={isSelected ? 17 : 14} fill={cfg.color} stroke="#0f172a" strokeWidth="2"/><circle cx={p.x} cy={p.y} r="26" fill="transparent" pointerEvents="all"/><text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8" fontWeight="800" pointerEvents="none">{p.label}</text></g>; })}
      </svg></div>
    </div>
    <div className="plant-no-print rounded-2xl border bg-white p-3 shadow-sm"><div className="grid grid-cols-3 gap-2 plant-tabs"><button onClick={() => setActiveTab('resumo')} className={`rounded-xl px-4 py-3 font-semibold ${activeTab === 'resumo' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}><FileText size={16} className="mr-1 inline"/>Resumo</button><button onClick={() => setActiveTab('editor')} className={`rounded-xl px-4 py-3 font-semibold ${activeTab === 'editor' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'}`}><MousePointer2 size={16} className="mr-1 inline"/>Editor 2D</button><button onClick={() => { setActiveTab('professor'); if (projectId) window.location.href = `/professor?projectId=${encodeURIComponent(projectId)}`; }} className={`rounded-xl px-4 py-3 font-semibold ${activeTab === 'professor' ? 'bg-violet-600 text-white' : 'hover:bg-slate-50'}`}><BrainCircuit size={16} className="mr-1 inline"/>Professor IA</button></div>
      {activeTab === 'resumo' && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Ambientes</div><div className="text-2xl font-bold">{stats.rooms}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Pontos</div><div className="text-2xl font-bold">{stats.points}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">TUG / TUE</div><div className="text-2xl font-bold">{stats.tug} / {stats.tue}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Potência</div><div className="text-2xl font-bold">{(stats.watts / 1000).toFixed(2)} kW</div></div></div>}
      {activeTab === 'editor' && <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">Editor ativo. Arraste qualquer ponto para posicioná-lo. O tamanho da área de trabalho acompanha a quantidade de ambientes.</div>}
    </div>
    <section className="plant-print hidden"><h1>Planta Elétrica — {currentProject?.name || 'Projeto'}</h1><p>Ambientes: {stats.rooms} · Pontos: {stats.points} · Iluminação: {stats.light} · TUG: {stats.tug} · TUE: {stats.tue} · Potência: {(stats.watts / 1000).toFixed(2)} kW</p><div className="plant-print-block mt-4">{rooms.map(r => <div key={r.id} className="mb-2 border-b pb-2"><strong>{r.name}</strong> — {(r.w / 55).toFixed(2)} × {(r.h / 55).toFixed(2)} m</div>)}</div><svg className="plant-canvas mt-5" viewBox={`0 0 ${bounds.width} ${bounds.height}`} width="100%" preserveAspectRatio="xMinYMin meet"><rect width={bounds.width} height={bounds.height} fill="white" stroke="#111"/>{rooms.map(r => <g key={r.id}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#fff" stroke="#111" strokeWidth="2"/><text x={r.x + 8} y={r.y + 18} fontSize="12">{r.name}</text></g>)}{points.map(p => <g key={p.id}><circle cx={p.x} cy={p.y} r="10" fill={palette[p.kind].color} stroke="#111"/><text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="7">{p.label}</text></g>)}</svg><h2 className="mt-6">Lista de pontos</h2>{points.map(p => <div key={`p-${p.id}`} className="text-sm">{p.label} — {palette[p.kind].label} — {rooms.find(r => r.id === p.roomId)?.name || '-'} — {p.watts} W</div>)}</section>
  </div>);
}
