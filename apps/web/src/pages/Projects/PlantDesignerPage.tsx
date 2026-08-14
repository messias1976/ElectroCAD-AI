import { useEffect, useMemo, useState, type PointerEvent } from 'react';
import { ArrowLeft, BrainCircuit, DoorOpen, FileText, Frame, Lightbulb, MousePointer2, Save, Sparkles, Trash2, WandSparkles, Square as WindowIcon, Zap } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';

type PointKind = 'Luz' | 'TUG' | 'TUE';
type Tool = 'select' | 'room' | 'door' | 'window' | PointKind;
type Voltage = 127 | 220;
type Opening = { id: string; side: 'top' | 'right' | 'bottom' | 'left'; offset: number; width: number };
type PlantPoint = { id: number; sourceId?: string; roomId: number; kind: PointKind; x: number; y: number; watts: number; voltage: Voltage; label: string; qty?: number; distance?: number; description?: string };
type Room = { id: number; name: string; x: number; y: number; w: number; h: number; doors?: Opening[]; windows?: Opening[] };
type Project = { id: string; name: string; description: string; client?: { id: string; name: string }; designData?: string | null; plantData?: string | null; projectData?: string | null };

const defaultRooms: Room[] = [
  { id: 1, name: 'Sala', x: 35, y: 35, w: 260, h: 180, doors: [{ id: 'd1', side: 'bottom', offset: 0.72, width: 48 }], windows: [{ id: 'w1', side: 'left', offset: 0.35, width: 80 }] },
  { id: 2, name: 'Cozinha', x: 300, y: 35, w: 230, h: 180, doors: [{ id: 'd2', side: 'left', offset: 0.5, width: 48 }], windows: [{ id: 'w2', side: 'top', offset: 0.45, width: 90 }] },
  { id: 3, name: 'Quarto 1', x: 35, y: 245, w: 230, h: 180, doors: [{ id: 'd3', side: 'top', offset: 0.55, width: 48 }], windows: [{ id: 'w3', side: 'right', offset: 0.45, width: 90 }] },
  { id: 4, name: 'Quarto 2', x: 275, y: 245, w: 230, h: 180, doors: [{ id: 'd4', side: 'top', offset: 0.45, width: 48 }], windows: [{ id: 'w4', side: 'bottom', offset: 0.35, width: 90 }] },
  { id: 5, name: 'Banheiro', x: 515, y: 245, w: 165, h: 180, doors: [{ id: 'd5', side: 'left', offset: 0.5, width: 45 }], windows: [] },
];

function stableNumericId(value: unknown, fallback: number) { const n = Number(value); if (Number.isFinite(n) && n > 0) return n; let h = 0; const s = String(value ?? ''); for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h || fallback) + 1000; }
function roomAt(rooms: Room[], x: number, y: number) { return rooms.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); }
function nearestRoomWall(rooms: Room[], x: number, y: number, maxDistance = 70) {
  let best: { room: Room; side: Opening['side']; distance: number } | null = null;
  for (const r of rooms) {
    const inside = x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    const dists = [
      { side: 'top' as const, distance: Math.abs(y - r.y), valid: x >= r.x && x <= r.x + r.w },
      { side: 'right' as const, distance: Math.abs(x - (r.x + r.w)), valid: y >= r.y && y <= r.y + r.h },
      { side: 'bottom' as const, distance: Math.abs(y - (r.y + r.h)), valid: x >= r.x && x <= r.x + r.w },
      { side: 'left' as const, distance: Math.abs(x - r.x), valid: y >= r.y && y <= r.y + r.h },
    ];
    for (const d of dists) {
      const distance = inside ? d.distance : d.valid ? d.distance : Math.hypot(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h)));
      if (distance <= maxDistance && (!best || distance < best.distance)) best = { room: r, side: d.side, distance };
    }
  }
  return best;
}
function parse(value: string | null | undefined) { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }
function normalizeKind(v: any): PointKind { return v === 'Iluminação' || v === 'Luz' ? 'Luz' : v === 'TUE' ? 'TUE' : 'TUG'; }

function mergeData(projectData?: string | null, plantData?: string | null, designData?: string | null) {
  const pd = parse(projectData), pl = parse(plantData), dd = parse(designData);
  const sourceRooms = [...(Array.isArray(pd.rooms) ? pd.rooms : []), ...(Array.isArray(pl.rooms) ? pl.rooms : [])];
  const roomsMap = new Map<string, any>();
  sourceRooms.forEach((r: any, i: number) => { const key = String(r.id ?? `r${i}`); roomsMap.set(key, { ...(roomsMap.get(key) || {}), ...r }); });
  let rooms: Room[] = [...roomsMap.values()].map((r: any, i: number) => ({
    id: stableNumericId(r.id, i + 1), name: String(r.name || `Ambiente ${i + 1}`),
    x: Number.isFinite(Number(r.x)) ? Number(r.x) : 35 + (i % 3) * 235,
    y: Number.isFinite(Number(r.y)) ? Number(r.y) : 35 + Math.floor(i / 3) * 210,
    w: Math.max(130, Number(r.w) || Number(r.length || 4) * 55), h: Math.max(100, Number(r.h) || Number(r.width || 2.8) * 55),
    doors: Array.isArray(r.doors) ? r.doors : [], windows: Array.isArray(r.windows) ? r.windows : [],
  }));
  if (!rooms.length && Array.isArray(dd.rooms)) rooms = dd.rooms.map((r: any, i: number) => ({ id: stableNumericId(r.id, i + 1), name: r.name || `Ambiente ${i + 1}`, x: 35 + (i % 3) * 235, y: 35 + Math.floor(i / 3) * 210, w: Math.max(130, Number(r.length || 4) * 55), h: Math.max(100, Number(r.width || 2.8) * 55), doors: r.doors || [], windows: r.windows || [] }));
  const allPoints = [...(Array.isArray(pd.points) ? pd.points : []), ...(Array.isArray(pl.points) ? pl.points : []), ...(Array.isArray(dd.points) ? dd.points : [])];
  const pointsMap = new Map<string, any>();
  allPoints.forEach((p: any, i: number) => { const key = String(p.sourceId ?? p.id ?? `p${i}`); pointsMap.set(key, { ...(pointsMap.get(key) || {}), ...p }); });
  const points: PlantPoint[] = [...pointsMap.values()].map((p: any, i: number) => {
    const sourceId = String(p.sourceId ?? p.id ?? `p${i + 1}`);
    const id = stableNumericId(sourceId, i + 1);
    const roomIdCandidate = stableNumericId(p.roomId, rooms[0]?.id || 1);
    const room = rooms.find(r => r.id === roomIdCandidate) || rooms[0];
    const px = Number(p.x), py = Number(p.y);
    const x = Number.isFinite(px) ? px : (room ? room.x + room.w / 2 : 100);
    const y = Number.isFinite(py) ? py : (room ? room.y + room.h / 2 : 100);
    return { id, sourceId, roomId: room?.id || 1, kind: normalizeKind(p.kind || p.type), x, y, watts: Number(p.watts) || 100, voltage: Number(p.voltage) === 220 ? 220 : 127, label: String(p.label || `${normalizeKind(p.kind || p.type) === 'Luz' ? 'L' : normalizeKind(p.kind || p.type) === 'TUG' ? 'T' : 'E'}${i + 1}`), qty: Number(p.qty) || 1, distance: Number(p.distance) || 10, description: String(p.description || p.equipment || '') };
  });
  return { rooms: rooms.length ? rooms : defaultRooms, points };
}

export default function PlantDesignerPage() {
  const [searchParams, setSearchParams] = useSearchParams(); const [projects, setProjects] = useState<Project[]>([]); const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [rooms, setRooms] = useState<Room[]>(defaultRooms); const [points, setPoints] = useState<PlantPoint[]>([]); const [selected, setSelected] = useState<number | null>(null); const [hovered, setHovered] = useState<number | null>(null); const [tool, setTool] = useState<Tool>('select');
  const [dragPoint, setDragPoint] = useState<number | null>(null); const [dragRoom, setDragRoom] = useState<number | null>(null); const [resizeRoom, setResizeRoom] = useState<number | null>(null); const [dragOpening, setDragOpening] = useState<{roomId:number; type:'door'|'window'; id:string} | null>(null); const [resizeOpening, setResizeOpening] = useState<{roomId:number; type:'door'|'window'; id:string} | null>(null); const [activeTab, setActiveTab] = useState<'resumo' | 'editor' | 'professor'>('resumo'); const [message, setMessage] = useState('Selecione um projeto para começar.');
  const currentProject = projects.find(p => p.id === projectId);
  const analysis = useMemo(() => { const total = points.reduce((s,p)=>s+p.watts,0); return { total, tugs: points.filter(p=>p.kind==='TUG').length, tue: points.filter(p=>p.kind==='TUE').length }; }, [points]);

  useEffect(() => { void loadProjects(); }, []);
  async function loadProjects() {
    try {
      const response = await apiFetch('/projects');
      const data: Project[] = Array.isArray(response) ? response : (response?.projects || response?.items || []);
      setProjects(data);
      const wanted = searchParams.get('projectId');
      const id = wanted && data.some((p: Project) => String(p.id) === String(wanted)) ? wanted : data[0]?.id || '';
      if (id) {
        setProjectId(String(id));
        setSearchParams({ projectId: String(id) }, { replace: true });
        loadProject(data.find((p: Project) => String(p.id) === String(id)));
      } else {
        setMessage('Nenhum projeto encontrado. Crie um projeto em “Meus projetos” para começar.');
      }
    } catch (e) {
      setMessage(`Erro ao carregar projetos: ${(e as Error).message}`);
    }
  }
  function loadProject(project?: Project) { if (!project) return; const merged = mergeData(project.projectData, project.plantData, project.designData); setRooms(merged.rooms); setPoints(merged.points); setSelected(null); setMessage(`Projeto "${project.name}" carregado: ${merged.rooms.length} ambientes e ${merged.points.length} pontos.`); }
  function selectProject(id:string) { setProjectId(id); setSearchParams({projectId:id}); loadProject(projects.find(p=>String(p.id)===String(id))); }
  function pos(e:PointerEvent<SVGSVGElement>) { const r=e.currentTarget.getBoundingClientRect(); return {x:Math.max(0,Math.min(740,((e.clientX-r.left)/r.width)*740)),y:Math.max(0,Math.min(500,((e.clientY-r.top)/r.height)*500))}; }
  function pointDown(e:PointerEvent<SVGGElement>, id:number) { e.stopPropagation(); setSelected(id); setDragPoint(id);  }
  function move(e:PointerEvent<SVGSVGElement>) {
    const p=pos(e);
    if(dragPoint!==null){
      const r=roomAt(rooms,p.x,p.y);
      setPoints(a=>a.map(x=>x.id===dragPoint?{...x,x:p.x,y:p.y,roomId:r?.id??x.roomId}:x));
    } else if(dragRoom!==null){
      const room=rooms.find(r=>r.id===dragRoom);
      if(room){
        const nx=Math.max(0,Math.min(740-room.w,p.x-room.w/2)), ny=Math.max(0,Math.min(500-room.h,p.y-room.h/2));
        const dx=nx-room.x,dy=ny-room.y;
        setRooms(a=>a.map(r=>r.id===dragRoom?{...r,x:nx,y:ny}:r));
        setPoints(a=>a.map(pt=>pt.roomId===dragRoom?{...pt,x:pt.x+dx,y:pt.y+dy}:pt));
      }
    } else if(resizeRoom!==null){
      const room=rooms.find(r=>r.id===resizeRoom);
      if(room){
        const nw=Math.max(130,Math.min(740-room.x,p.x-room.x)), nh=Math.max(100,Math.min(500-room.y,p.y-room.y));
        setRooms(a=>a.map(r=>r.id===resizeRoom?{...r,w:nw,h:nh}:r));
      }
    } else if(dragOpening){
      const snap=nearestRoomWall(rooms,p.x,p.y,90);
      if(!snap) return;
      setRooms(a=>a.map(r=>{
        if(r.id!==dragOpening.roomId && r.id!==snap.room.id) return r;
        const key=dragOpening.type==='door'?'doors':'windows';
        if(r.id!==dragOpening.roomId) return r;
        const arr=[...(r[key]||[])]; const idx=arr.findIndex(o=>o.id===dragOpening.id);
        if(idx<0) return r;
        const o=arr[idx];
        const horizontal=snap.side==='top'||snap.side==='bottom';
        const span=horizontal?snap.room.w:snap.room.h;
        const along=horizontal?p.x-snap.room.x:p.y-snap.room.y;
        const offset=Math.max(0.05,Math.min(0.95,along/span));
        const maxWidth=Math.max(30,span-20);
        arr[idx]={...o,side:snap.side,offset,width:Math.min(Math.max(30,o.width),maxWidth)};
        if(snap.room.id!==dragOpening.roomId){
          const source=r;
          const dest=a.find(rr=>rr.id===snap.room.id);
          if(!dest) return r;
          const sourceArr=arr.filter((_,j)=>j!==idx);
          const destArr=[...(dest[key]||[]),{...o,side:snap.side,offset,width:Math.min(Math.max(30,o.width),maxWidth)}];
        }
        return {...r,[key]:arr};
      }));
      if(snap.room.id!==dragOpening.roomId){
        const sourceId=dragOpening.roomId, destId=snap.room.id, key=dragOpening.type==='door'?'doors':'windows';
        const source=rooms.find(r=>r.id===sourceId), dest=rooms.find(r=>r.id===destId);
        const o=source?.[key]?.find((x:any)=>x.id===dragOpening.id);
        if(o){
          const horizontal=snap.side==='top'||snap.side==='bottom';
          const span=horizontal?snap.room.w:snap.room.h;
          const along=horizontal?p.x-snap.room.x:p.y-snap.room.y;
          const offset=Math.max(0.05,Math.min(0.95,along/span));
          const moved={...o,side:snap.side,offset,width:Math.min(Math.max(30,o.width),Math.max(30,span-20))};
          setRooms(a=>a.map(r=>r.id===sourceId?{...r,[key]:(r[key]||[]).filter((x:any)=>x.id!==dragOpening.id)}:r.id===destId?{...r,[key]:[...(r[key]||[]),moved]}:r));
        }
      }
    } else if(resizeOpening){
      setRooms(a=>a.map(r=>{
        if(r.id!==resizeOpening.roomId) return r;
        const key=resizeOpening.type==='door'?'doors':'windows'; const arr=[...(r[key]||[])]; const idx=arr.findIndex(o=>o.id===resizeOpening.id);
        if(idx<0) return r;
        const o=arr[idx], horizontal=o.side==='top'||o.side==='bottom', span=horizontal?r.w:r.h;
        const along=horizontal?p.x-r.x:p.y-r.y, center=span*o.offset, half=Math.abs(along-center);
        const width=Math.max(30,Math.min(span-10,half*2));
        arr[idx]={...o,width}; return {...r,[key]:arr};
      }));
    }
  }
  function addPointAt(x:number,y:number){const r=roomAt(rooms,x,y); if(!r){setMessage('Clique dentro de um ambiente para colocar o ponto.');return;} const k=tool as PointKind; const n=points.length+1; const sourceId=`p-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; const p:PlantPoint={id:stableNumericId(sourceId,points.length+1),sourceId,roomId:r.id,kind:k,x,y,watts:k==='Luz'?100:k==='TUG'?100:1500,voltage:k==='TUE'?220:127,label:`${k==='Luz'?'L':k==='TUG'?'T':'E'}${n}`,qty:1,distance:10,description:k==='Luz'?'Ponto de iluminação':k==='TUG'?'Tomada de uso geral':'Tomada de uso específico'}; setPoints(a=>[...a,p]); setSelected(p.id); setTool('select'); }
  function addRoom(x:number,y:number){const id=Date.now(); const r:Room={id,name:`Ambiente ${rooms.length+1}`,x:Math.max(0,Math.min(740-180,x-90)),y:Math.max(0,Math.min(500-130,y-65)),w:180,h:130,doors:[],windows:[]}; setRooms(a=>[...a,r]); setTool('select'); setMessage('Novo ambiente criado. Arraste-o para encostar aos demais e use as ferramentas Porta/Janela.');}
  function openingAt(x:number,y:number,type:'door'|'window'){
    const snap=nearestRoomWall(rooms,x,y,100);
    if(!snap){setMessage('Clique dentro de um ambiente ou próximo de uma parede.');return;}
    const horizontal=snap.side==='top'||snap.side==='bottom';
    const span=horizontal?snap.room.w:snap.room.h;
    const along=horizontal?x-snap.room.x:y-snap.room.y;
    const offset=Math.max(0.05,Math.min(0.95,along/span));
    const opening:Opening={id:`${type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,side:snap.side,offset,width:Math.min(type==='door'?70:100,Math.max(30,span-20))};
    setRooms(a=>a.map(room=>room.id===snap.room.id?{...room,[type==='door'?'doors':'windows']:[...(room[type==='door'?'doors':'windows']||[]),opening]}:room));
    setTool('select');
    setMessage(`${type==='door'?'Porta':'Janela'} criada em ${snap.room.name}, parede ${snap.side}. Agora você pode arrastar para qualquer parede e redimensionar.`);
  }
  function canvasClick(e:PointerEvent<SVGSVGElement>){if(dragPoint!==null||dragRoom!==null)return;const p=pos(e); if(tool==='room')return addRoom(p.x,p.y); if(tool==='door'||tool==='window')return openingAt(p.x,p.y,tool); if(tool==='Luz'||tool==='TUG'||tool==='TUE')return addPointAt(p.x,p.y);}
  function finishDrag(){if(dragPoint!==null||dragRoom!==null||resizeRoom!==null||dragOpening||resizeOpening)setMessage('Alteração atualizada. Clique em Salvar para gravar.');setDragPoint(null);setDragRoom(null);setResizeRoom(null);setDragOpening(null);setResizeOpening(null);}
  function roomDown(e:PointerEvent<SVGGElement>,id:number){if(tool!=='select')return;e.stopPropagation();setDragRoom(id);}
  async function save(){if(!currentProject){setMessage('Selecione um projeto.');return;} let pd=parse(currentProject.projectData); const normalized=points.map(p=>({id:p.sourceId||String(p.id),sourceId:p.sourceId||String(p.id),roomId:p.roomId,type:p.kind==='Luz'?'Iluminação':p.kind,kind:p.kind,qty:p.qty||1,watts:p.watts,voltage:p.voltage,distance:p.distance||10,description:p.description||p.label,equipment:p.description||p.label,x:p.x,y:p.y,label:p.label})); const byId=new Map<string,any>((Array.isArray(pd.points)?pd.points:[]).map((p:any)=>[String(p.id),p])); normalized.forEach(p=>byId.set(String(p.id),{...(byId.get(String(p.id))||{}),...p})); const normalizedRooms=rooms.map(r=>({id:r.id,name:r.name,x:r.x,y:r.y,w:r.w,h:r.h,length:Number((r.w/55).toFixed(2)),width:Number((r.h/55).toFixed(2)),area:Number(((r.w*r.h)/(55*55)).toFixed(2)),doors:r.doors||[],windows:r.windows||[]})); pd.rooms=normalizedRooms; pd.points=[...byId.values()]; pd.source='project-central-source'; pd.updatedAt=new Date().toISOString(); const projectData=JSON.stringify(pd); const plantData=JSON.stringify({rooms:normalizedRooms,points:normalized,source:'plant-editor-2d',savedAt:new Date().toISOString()}); const designData=JSON.stringify({project:{name:currentProject.name,client:currentProject.client?.name||''},rooms:normalizedRooms,points:pd.points,generated:false,savedAt:new Date().toISOString(),source:'plant-editor-2d'}); try{await apiFetch(`/projects/${currentProject.id}`,{method:'PUT',body:JSON.stringify({plantData,designData,projectData})});setProjects(a=>a.map(p=>p.id===currentProject.id?{...p,plantData,designData,projectData}:p));setMessage(`Salvo: ${rooms.length} ambientes, ${points.length} pontos, ${(rooms.reduce((s,r)=>s+(r.doors?.length||0),0))} portas e ${(rooms.reduce((s,r)=>s+(r.windows?.length||0),0))} janelas.`);}catch(e){setMessage(`Erro ao salvar: ${(e as Error).message}`);}}

  function openingGeom(r:Room,o:Opening){
    const horizontal=o.side==='top'||o.side==='bottom';
    const cx=horizontal?r.x+r.w*o.offset:r.x+(o.side==='right'?r.w:0);
    const cy=horizontal?r.y+(o.side==='bottom'?r.h:0):r.y+r.h*o.offset;
    const half=o.width/2;
    return horizontal
      ? {cx,cy,x1:cx-half,y1:cy,x2:cx+half,y2:cy}
      : {cx,cy,x1:cx,y1:cy-half,x2:cx,y2:cy+half};
  }

  return <div className="min-h-full space-y-5 pb-8 text-left">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="mb-1 flex items-center gap-2 text-sm text-slate-500"><Link to="/projetista"><ArrowLeft size={16} className="inline"/> Projetista</Link><span>/</span><span>Planta</span></div><h2 className="text-3xl font-bold">Planta Elétrica 2D</h2><p className="text-sm text-slate-500">Monte a planta por ambientes, mova os cômodos e inclua portas e janelas.</p></div><div className="flex flex-wrap gap-2"><select value={projectId} onChange={e=>selectProject(e.target.value)} className="rounded-xl border bg-white px-3 py-2 font-semibold"><option value="">Selecionar projeto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}{p.client?` — ${p.client.name}`:''}</option>)}</select><button onClick={()=>void save()} className="rounded-xl border bg-white px-4 py-2 font-semibold"><Save size={17} className="mr-2 inline"/>Salvar</button><button onClick={()=>{void save();window.location.href=`/projetista?projectId=${encodeURIComponent(projectId)}`}} className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"><WandSparkles size={17} className="mr-2 inline"/>Projetista</button></div></div>
    <div className="grid gap-2 rounded-2xl border bg-white p-2 sm:grid-cols-7">
      {([['select','Selecionar',MousePointer2],['room','Ambiente',Frame],['door','Porta',DoorOpen],['window','Janela',WindowIcon],['Luz','Iluminação',Lightbulb],['TUG','TUG',MousePointer2],['TUE','TUE',Zap]] as const).map(([id,label,Icon])=><button key={id} onClick={()=>setTool(id)} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${tool===id?'bg-blue-600 text-white':'text-slate-700 hover:bg-slate-50'}`}><Icon size={16} className="mr-1 inline"/>{label}</button>)}
    </div>
    <div className="rounded-xl border bg-blue-50 px-4 py-3 text-sm text-blue-900"><b>Como montar:</b> arraste um ambiente para posicioná-lo; use o quadrado azul para redimensionar; arraste uma porta/janela até qualquer uma das 4 paredes; enquanto arrasta, a abertura muda automaticamente para a parede mais próxima. Use o ponto colorido na extremidade para ajustar a largura livremente. Clique em Salvar para gravar tudo no projeto.</div>
    <div className="grid gap-5 rounded-2xl border bg-white p-3 shadow-sm lg:grid-cols-[1fr_260px]">
      <div className="overflow-auto rounded-xl bg-slate-100 p-2"><svg viewBox="0 0 740 500" className="min-w-[740px] rounded-xl bg-white shadow-inner" preserveAspectRatio="xMidYMid meet" onClick={canvasClick} onPointerMove={move} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
        <defs><pattern id="grid-v16" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e2e8f0"/></pattern></defs><rect width="740" height="500" fill="url(#grid-v16)"/>
        {rooms.map(r=><g key={r.id} onPointerDown={e=>roomDown(e,r.id)} className={tool==='select'?'cursor-move':'cursor-crosshair'}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#f8fafc" stroke="#334155" strokeWidth="3"/><text x={r.x+10} y={r.y+22} fontSize="13" fontWeight="700" fill="#0f172a">{r.name}</text><text x={r.x+10} y={r.y+38} fontSize="9" fill="#64748b">{(r.w/55).toFixed(2)} × {(r.h/55).toFixed(2)} m</text><rect x={r.x+r.w-10} y={r.y+r.h-10} width="18" height="18" rx="4" fill="#2563eb" opacity="0.9" className="cursor-se-resize" onPointerDown={e=>{e.stopPropagation();setResizeRoom(r.id);}}/><title>Redimensionar ambiente</title>
          {(r.doors||[]).map(o=>{const g=openingGeom(r,o);return <g key={o.id} onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);setDragOpening({roomId:r.id,type:'door',id:o.id});}} className="cursor-move"><line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="white" strokeWidth="10"/><line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#f59e0b" strokeWidth="5"/><circle cx={g.x2} cy={g.y2} r="7" fill="#f59e0b" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);setResizeOpening({roomId:r.id,type:'door',id:o.id});}}/><title>Porta — arraste para mover; use o ponto na extremidade para ajustar a largura</title></g>})}
          {(r.windows||[]).map(o=>{const g=openingGeom(r,o);return <g key={o.id} onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);setDragOpening({roomId:r.id,type:'window',id:o.id});}} className="cursor-move"><line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="white" strokeWidth="10"/><line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#06b6d4" strokeWidth="6"/><circle cx={g.x2} cy={g.y2} r="7" fill="#06b6d4" onPointerDown={e=>{e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);setResizeOpening({roomId:r.id,type:'window',id:o.id});}}/><title>Janela — arraste para mover; use o ponto na extremidade para ajustar a largura</title></g>})}
        </g>)}
        {points.map(p=>{const c=p.kind==='Luz'?'#facc15':p.kind==='TUG'?'#60a5fa':'#fb923c';const room=rooms.find(r=>r.id===p.roomId);const hover=hovered===p.id;return <g key={p.id} onPointerDown={e=>{e.stopPropagation(); if(tool==='select') {setSelected(p.id);setDragPoint(p.id);}}} onMouseEnter={()=>setHovered(p.id)} onMouseLeave={()=>setHovered(null)} className="cursor-grab"><circle cx={p.x} cy={p.y} r={selected===p.id?16:13} fill={c} stroke="#0f172a" strokeWidth="2"/><text x={p.x} y={p.y+4} textAnchor="middle" fontSize="8" fontWeight="800">{p.label}</text>{hover&&<g pointerEvents="none"><rect x={Math.min(570,p.x+15)} y={Math.max(5,p.y-70)} width="160" height="58" rx="8" fill="#0f172a"/><text x={Math.min(580,p.x+25)} y={Math.max(22,p.y-53)} fontSize="10" fontWeight="700" fill="white">{p.label} · {p.kind}</text><text x={Math.min(580,p.x+25)} y={Math.max(38,p.y-37)} fontSize="9" fill="#e2e8f0">{room?.name} · {p.watts} W · {p.voltage} V</text><text x={Math.min(580,p.x+25)} y={Math.max(52,p.y-23)} fontSize="8" fill="#cbd5e1">Arraste para reposicionar</text></g>}</g>})}
      </svg></div>
      <aside className="rounded-xl bg-slate-50 p-4"><h3 className="font-bold">Dados da planta</h3><div className="mt-4 space-y-2 text-sm"><div><b>{rooms.length}</b> ambientes</div><div><b>{points.length}</b> pontos</div><div><b>{rooms.reduce((s,r)=>s+(r.doors?.length||0),0)}</b> portas</div><div><b>{rooms.reduce((s,r)=>s+(r.windows?.length||0),0)}</b> janelas</div><div><b>{(analysis.total/1000).toFixed(2)} kW</b> cadastrados</div></div><div className="mt-5 rounded-xl bg-white p-3 text-xs text-slate-600">{message}</div>{selected&&<div className="mt-4 rounded-xl bg-white p-3"><b>Ponto selecionado</b><p className="mt-1">{points.find(p=>p.id===selected)?.label}</p><button onClick={()=>{setPoints(a=>a.filter(p=>p.id!==selected));setSelected(null)}} className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={14} className="mr-1 inline"/>Excluir ponto</button></div>}</aside>
    </div>
    <div className="grid gap-2 rounded-2xl border bg-white p-2 sm:grid-cols-3"><button onClick={()=>setActiveTab('resumo')} className={`rounded-xl px-4 py-2 font-semibold ${activeTab==='resumo'?'bg-slate-900 text-white':''}`}><FileText size={16} className="mr-1 inline"/>Resumo</button><button onClick={()=>setActiveTab('editor')} className={`rounded-xl px-4 py-2 font-semibold ${activeTab==='editor'?'bg-blue-600 text-white':''}`}><MousePointer2 size={16} className="mr-1 inline"/>Editor 2D</button><button onClick={()=>setActiveTab('professor')} className={`rounded-xl px-4 py-2 font-semibold ${activeTab==='professor'?'bg-violet-600 text-white':''}`}><BrainCircuit size={16} className="mr-1 inline"/>Professor IA</button></div>
  </div>;
}
