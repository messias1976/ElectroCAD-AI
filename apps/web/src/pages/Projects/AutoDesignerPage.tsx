import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../services/api";
import {
  Plus, Trash2, WandSparkles, Printer, Save, Zap, Download,
  Home, FileText, RotateCcw, CheckCircle2, AlertTriangle
} from "lucide-react";

type PointType = "Iluminação" | "TUG" | "TUE";
type Phase = "A" | "B" | "AB";
type Voltage = 127 | 220;

type Room = { id: number; name: string; area: number };
type Point = {
  id: number; roomId: number; type: PointType; qty: number; watts: number;
  voltage: Voltage; distance: number; description: string;
};
type Circuit = {
  id: number; name: string; type: PointType; rooms: string[]; watts: number;
  current: number; voltage: Voltage; phase: Phase; conductors: string;
  breaker: number; distance: number; drop: number; points: number;
};

const defaultRooms: Room[] = [
  { id: 1, name: "Sala", area: 16 },
  { id: 2, name: "Cozinha", area: 10 },
  { id: 3, name: "Quarto 1", area: 12 },
  { id: 4, name: "Quarto 2", area: 10 },
  { id: 5, name: "Banheiro", area: 4 },
  { id: 6, name: "Varanda", area: 6 },
];

const defaultPoints: Point[] = [
  { id: 1, roomId: 1, type: "Iluminação", qty: 1, watts: 100, voltage: 127, distance: 12, description: "Ponto de luz" },
  { id: 2, roomId: 2, type: "Iluminação", qty: 1, watts: 100, voltage: 127, distance: 15, description: "Ponto de luz" },
  { id: 3, roomId: 3, type: "Iluminação", qty: 1, watts: 100, voltage: 127, distance: 10, description: "Ponto de luz" },
  { id: 4, roomId: 4, type: "Iluminação", qty: 1, watts: 100, voltage: 127, distance: 10, description: "Ponto de luz" },
  { id: 5, roomId: 2, type: "TUG", qty: 4, watts: 100, voltage: 127, distance: 15, description: "Tomadas de uso geral" },
  { id: 6, roomId: 1, type: "TUG", qty: 4, watts: 100, voltage: 127, distance: 12, description: "Tomadas de uso geral" },
  { id: 7, roomId: 2, type: "TUE", qty: 1, watts: 5500, voltage: 220, distance: 18, description: "Chuveiro elétrico" },
];

const breakers = [6, 10, 16, 20, 25, 32, 40, 50, 63];
const specialTugRooms = ["Cozinha", "Banheiro", "Área de serviço", "Lavanderia"];

function conductorFor(current: number, type: PointType) {
  if (type === "Iluminação") return "1,5 mm²";
  if (current <= 16) return "2,5 mm²";
  if (current <= 25) return "4 mm²";
  if (current <= 32) return "6 mm²";
  if (current <= 41) return "10 mm²";
  return "16 mm²";
}
function breakerFor(current: number, type: PointType) {
  const minimum = type === "Iluminação" ? 10 : 16;
  return breakers.find((x) => x >= Math.max(current * 1.25, minimum)) ?? 63;
}
function phaseFor(index: number, voltage: Voltage): Phase {
  return voltage === 220 ? "AB" : index % 2 === 0 ? "A" : "B";
}
function estimatedDrop(current: number, distance: number, voltage: Voltage, section: string) {
  const area = Number(section.replace(",", ".").replace(" mm²", ""));
  const rho = 0.0175;
  const factor = voltage === 220 ? 2 : 2;
  return (current * distance * rho * factor / (area * voltage)) * 100;
}
function csvEscape(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

type SavedProject = { id: string; name: string; description: string; client?: { id: string; name: string } | null; designData?: string | null; plantData?: string | null; projectData?: string | null };

function buildDesignerFromProjectData(projectData?: string | null) {
  if (!projectData) return null;
  try {
    const data = JSON.parse(projectData);
    if (!Array.isArray(data.rooms)) return null;
    const rooms: Room[] = data.rooms.map((r: any, i: number) => ({
      id: Number(r.id) || i + 1,
      name: String(r.name || `Ambiente ${i + 1}`),
      area: Number(r.area) || Math.max(1, Number(r.length || 4) * Number(r.width || 2.5)),
    }));
    const points: Point[] = (Array.isArray(data.points) ? data.points : []).map((p: any, i: number) => ({
      id: Number(p.id) || Date.now() + i,
      roomId: Number(p.roomId) || rooms[0]?.id || 1,
      type: p.type === 'Iluminação' ? 'Iluminação' : p.type === 'TUE' ? 'TUE' : 'TUG',
      qty: Number(p.qty) || 1,
      watts: Number(p.watts) || 100,
      voltage: Number(p.voltage) === 220 ? 220 : 127,
      distance: Number(p.distance) || 10,
      description: String(p.equipment || p.description || 'Ponto elétrico'),
    }));
    return { rooms: rooms.length ? rooms : defaultRooms, points };
  } catch { return null; }
}

function buildDesignerFromPlant(plantData?: string | null) {
  if (!plantData) return null;
  try {
    const saved = JSON.parse(plantData);
    if (!Array.isArray(saved.rooms) || !Array.isArray(saved.points)) return null;
    const roomById = new Map<number, Room>();
    const nextRooms: Room[] = saved.rooms.map((r: any, i: number) => {
      const room: Room = {
        id: Number(r.id) || i + 1,
        name: String(r.name || `Ambiente ${i + 1}`),
        area: Number(r.area) || Math.max(1, Math.round(((Number(r.w) || 210) * (Number(r.h) || 150)) / 1000)),
      };
      roomById.set(room.id, room);
      return room;
    });
    const nextPoints: Point[] = saved.points.map((p: any, i: number) => {
      const type: PointType = p.kind === 'Luz' ? 'Iluminação' : p.kind === 'TUE' ? 'TUE' : 'TUG';
      return {
        id: Number(p.id) || Date.now() + i,
        roomId: Number(p.roomId) || nextRooms[0]?.id || 1,
        type,
        qty: Number(p.qty) || 1,
        watts: Number(p.watts) || 100,
        voltage: Number(p.voltage) === 220 ? 220 : 127,
        distance: Number(p.distance) || 10,
        description: String(p.description || p.label || 'Ponto elétrico'),
      };
    });
    return { rooms: nextRooms.length ? nextRooms : defaultRooms, points: nextPoints.length ? nextPoints : defaultPoints };
  } catch {
    return null;
  }
}

type PlantRoom = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  area?: number;
};

type ExistingRoom = Partial<PlantRoom> & {
  id?: string | number;
};

type ExistingPoint = {
  id?: string | number;
  x?: number;
  y?: number;
  label?: string;
};

function buildPlantFromDesigner(
  rooms: Room[],
  points: Point[],
  existingPlantData?: string | null,
) {
  let existing: {
    rooms?: ExistingRoom[];
    points?: ExistingPoint[];
  } = {};

  try {
    existing = existingPlantData
      ? JSON.parse(existingPlantData)
      : {};
  } catch {
    existing = {};
  }

  const existingRooms: ExistingRoom[] = Array.isArray(existing.rooms)
    ? existing.rooms
    : [];

  const existingPoints: ExistingPoint[] = Array.isArray(existing.points)
    ? existing.points
    : [];

  const roomByIdExisting = new Map<string, ExistingRoom>(
    existingRooms.map((r) => [String(r.id), r]),
  );

  const plantRooms: PlantRoom[] = rooms.map((r, i) => {
    const saved = roomByIdExisting.get(String(r.id));

    return {
      id: r.id,
      name: r.name,
      x: Number(saved?.x) || 30 + (i % 3) * 235,
      y: Number(saved?.y) || 30 + Math.floor(i / 3) * 185,
      w: Number(saved?.w) || 210,
      h: Number(saved?.h) || 150,
      area: r.area,
    };
  });

  const roomMap = new Map<number, PlantRoom>(
    plantRooms.map((r) => [r.id, r]),
  );

  const savedPointMap = new Map<string, ExistingPoint>(
    existingPoints.map((p) => [String(p.id), p]),
  );

  const plantPoints = points.map((p, i) => {
    const room = roomMap.get(p.roomId) || plantRooms[0];
    const saved = savedPointMap.get(String(p.id));

    const kind: 'Luz' | 'TUG' | 'TUE' =
      p.type === 'Iluminação' ? 'Luz' : p.type;

    return {
      id: p.id,
      roomId: p.roomId,
      kind,

      // Preserva a posição manual da planta 2D.
      x: Number(saved?.x) || (room ? room.x + room.w / 2 : 100),
      y: Number(saved?.y) || (room ? room.y + room.h / 2 : 100),

      watts: p.watts,
      voltage: p.voltage,

      label:
        saved?.label ||
        (kind === 'Luz'
          ? `L${i + 1}`
          : kind === 'TUG'
            ? `T${i + 1}`
            : `E${i + 1}`),

      qty: p.qty,
      distance: p.distance,
      description: p.description,
    };
  });

  return {
    rooms: plantRooms,
    points: plantPoints,
    savedAt: new Date().toISOString(),
    source: 'project-integrated',
  };
}

export default function AutoDesignerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [savedProjectId, setSavedProjectId] = useState(searchParams.get("projectId") || "");
  const [project, setProject] = useState({ name: "Projeto Residencial", client: "", voltage: "127/220 V", mainBreaker: 40 });
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [points, setPoints] = useState<Point[]>(defaultPoints);
  const [generated, setGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<"projeto" | "pontos" | "resultado">("projeto");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    void loadSavedProjects();
  }, []);

  async function loadSavedProjects() {
    try {
      const data = await apiFetch("/projects");
      setSavedProjects(data);
      const wanted = searchParams.get("projectId");
      const id = wanted && data.some((p: SavedProject) => p.id === wanted) ? wanted : data[0]?.id || "";
      if (id) {
        setSavedProjectId(id);
        setSearchParams({ projectId: id }, { replace: true });
        const selected = data.find((p: SavedProject) => p.id === id);
        if (selected) {
          setProject((current) => ({
            ...current,
            name: selected.name,
            client: selected.client?.name || "",
          }));
          // O projeto é a fonte única de verdade: se houver planta, ela tem prioridade.
          const fromPlant = buildDesignerFromPlant(selected.plantData);
          if (fromPlant) {
            setRooms(fromPlant.rooms);
            setPoints(fromPlant.points);
            let hasGenerated = false;
            if (selected.designData) { try { hasGenerated = Boolean(JSON.parse(selected.designData).generated); } catch {} }
            setGenerated(hasGenerated);
          } else if (selected.designData) {
            try {
              const saved = JSON.parse(selected.designData);
              if (Array.isArray(saved.rooms)) setRooms(saved.rooms);
              if (Array.isArray(saved.points)) setPoints(saved.points);
              setGenerated(Boolean(saved.generated));
            } catch {}
          } else {
            const fromProject = buildDesignerFromProjectData(selected.projectData);
            if (fromProject) {
              setRooms(fromProject.rooms);
              setPoints(fromProject.points);
              setGenerated(false);
            }
          }
        }
      }
    } catch {}
  }

  async function saveToServer() {
    if (!savedProjectId) {
      setSaveMessage("Selecione ou crie um projeto para salvar no servidor.");
      return;
    }
    const designData = JSON.stringify({ project, rooms, points, circuits, generated, savedAt: new Date().toISOString(), source: "automatic-designer" });
    const plantData = JSON.stringify(buildPlantFromDesigner(rooms, points, savedProjects.find((p) => p.id === savedProjectId)?.plantData));
    try {
      await apiFetch(`/projects/${savedProjectId}`, {
        method: "PUT",
        body: JSON.stringify({ name: project.name, designData, plantData }),
      });
      setSavedProjects((items) => items.map((p) => p.id === savedProjectId ? { ...p, name: project.name, designData, plantData } : p));
      setSaveMessage("Projeto, planta e dimensionamento sincronizados no servidor.");
    } catch (error) {
      setSaveMessage(`Erro ao salvar no servidor: ${(error as Error).message}`);
    }
  }

  const circuits = useMemo<Circuit[]>(() => {
    if (!generated) return [];
    const groups = new Map<string, Point[]>();
    const roomById = new Map(rooms.map((r) => [r.id, r]));

    // Iluminação: um circuito por conjunto de ambientes, limitado pelo disjuntor de 10 A.
    const lighting = points.filter((p) => p.type === "Iluminação");
    const lightingChunks: Point[][] = [];
    let currentChunk: Point[] = [];
    let chunkWatts = 0;
    for (const p of lighting) {
      const w = p.qty * p.watts;
      if (currentChunk.length && (chunkWatts + w) / 127 > 8) {
        lightingChunks.push(currentChunk);
        currentChunk = [];
        chunkWatts = 0;
      }
      currentChunk.push(p);
      chunkWatts += w;
    }
    if (currentChunk.length) lightingChunks.push(currentChunk);
    lightingChunks.forEach((list, i) => groups.set(`Iluminação-${i}`, list));

    // TUG: separa áreas de maior concentração de tomadas das demais áreas.
    for (const p of points.filter((x) => x.type === "TUG")) {
      const room = roomById.get(p.roomId)?.name ?? "Ambiente";
      const key = `TUG-${specialTugRooms.includes(room) ? "carga" : "geral"}`;
      groups.set(key, [...(groups.get(key) ?? []), p]);
    }

    // TUE: cada carga dedicada gera seu próprio circuito.
    points.filter((p) => p.type === "TUE").forEach((p) => groups.set(`TUE-${p.id}`, [p]));

    return [...groups.entries()].map(([key, list], index) => {
      const type = (key.startsWith("Iluminação") ? "Iluminação" : key.startsWith("TUG") ? "TUG" : "TUE") as PointType;
      const voltage = (list.every((p) => p.voltage === 220) ? 220 : 127) as Voltage;
      const watts = list.reduce((sum, p) => sum + p.qty * p.watts, 0);
      const current = watts / voltage;
      const distance = Math.max(...list.map((p) => p.distance), 1);
      const conductor = conductorFor(current, type);
      const drop = estimatedDrop(current, distance, voltage, conductor);
      const roomsInCircuit = [...new Set(list.map((p) => roomById.get(p.roomId)?.name ?? "Ambiente"))];
      const name = type === "TUE" ? `C${index + 1} ${list[0].description}` : `C${index + 1} ${type}`;
      return {
        id: index + 1, name, type, rooms: roomsInCircuit, watts, current, voltage,
        phase: phaseFor(index, voltage), conductors: conductor,
        breaker: breakerFor(current, type), distance, drop, points: list.reduce((s, p) => s + p.qty, 0),
      };
    });
  }, [generated, points, rooms]);

  const totalWatts = points.reduce((sum, p) => sum + p.qty * p.watts, 0);
  const warnings = circuits.filter((c) => c.drop > 4 || c.current > c.breaker);

  function addRoom() {
    setRooms((r) => [...r, { id: Date.now(), name: `Ambiente ${r.length + 1}`, area: 10 }]);
  }
  function updateRoom(id: number, field: keyof Room, value: string) {
    setRooms((rs) => rs.map((r) => r.id === id ? { ...r, [field]: field === "area" ? Number(value) : value } : r));
  }
  function addPoint() {
    setPoints((p) => [...p, { id: Date.now(), roomId: rooms[0]?.id ?? 1, type: "TUG", qty: 1, watts: 100, voltage: 127, distance: 10, description: "Novo ponto" }]);
  }
  function updatePoint(id: number, field: keyof Point, value: string) {
    setPoints((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      if (["qty", "watts", "distance", "roomId"].includes(field)) return { ...p, [field]: Number(value) } as Point;
      if (field === "voltage") return { ...p, voltage: Number(value) as Voltage };
      if (field === "type") return { ...p, type: value as PointType };
      return { ...p, [field]: value } as Point;
    }));
  }
  function save() {
    localStorage.setItem("electrocad-project", JSON.stringify({ project, rooms, points, circuits, generated, savedAt: new Date().toISOString() }));
    void saveToServer();
  }
  function reset() {
    if (!confirm("Restaurar os dados iniciais?")) return;
    setRooms(defaultRooms); setPoints(defaultPoints); setGenerated(false); setActiveTab("projeto");
  }
  function exportCsv() {
    const header = ["Circuito", "Tipo", "Ambientes", "Carga W", "Corrente A", "Tensão V", "Fase", "Condutor", "Disjuntor A", "Distância m", "Queda de tensão %"];
    const rows = circuits.map((c) => [c.name, c.type, c.rooms.join(" / "), c.watts, c.current.toFixed(2), c.voltage, c.phase, c.conductors, c.breaker, c.distance, c.drop.toFixed(2)]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${project.name.replaceAll(/\s+/g, "-")}-quadro-de-cargas.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full space-y-6 pb-12 text-left print:bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div><h2 className="text-3xl font-bold text-slate-900">Projetista Automático</h2><p className="mt-1 text-sm text-slate-500">Da casa ao quadro de cargas, diagrama e lista preliminar de materiais.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={savedProjectId} onChange={(e) => {
            const id = e.target.value;
            setSavedProjectId(id);
            setSearchParams(id ? { projectId: id } : {});
            const selected = savedProjects.find((p) => p.id === id);
            if (selected) {
              setProject((current) => ({ ...current, name: selected.name, client: selected.client?.name || "" }));
              if (selected.designData) {
                try {
                  const saved = JSON.parse(selected.designData);
                  if (Array.isArray(saved.rooms)) setRooms(saved.rooms);
                  if (Array.isArray(saved.points)) setPoints(saved.points);
                  setGenerated(Boolean(saved.generated));
                } catch {}
              }
            }
          }} className="rounded-xl border bg-white px-3 py-2 font-semibold">
            <option value="">Selecionar projeto</option>
            {savedProjects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.client ? ` — ${p.client.name}` : ""}</option>)}
          </select>
          <button onClick={save} className="rounded-xl border bg-white px-4 py-2 font-semibold"><Save size={17} className="mr-2 inline"/>Salvar</button>
          <button onClick={exportCsv} disabled={!generated} className="rounded-xl border bg-white px-4 py-2 font-semibold disabled:opacity-40"><Download size={17} className="mr-2 inline"/>CSV</button>
          <button onClick={() => window.print()} className="rounded-xl border bg-white px-4 py-2 font-semibold"><Printer size={17} className="mr-2 inline"/>Imprimir / PDF</button>
          <button onClick={reset} className="rounded-xl border bg-white px-4 py-2 font-semibold"><RotateCcw size={17} className="mr-2 inline"/>Resetar</button>
        </div>
      </div>

      {saveMessage ? <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 print:hidden">{saveMessage}</div> : null}

      <div className="grid gap-3 md:grid-cols-3 print:hidden">
        {[['projeto','1. Projeto'],['pontos','2. Ambientes e pontos'],['resultado','3. Projeto gerado']].map(([id,label], i) => (
          <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} className={`rounded-xl border p-3 text-left ${activeTab === id ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
            <div className="text-xs font-semibold text-slate-500">ETAPA {i + 1}</div><div className="font-bold">{label}</div>
          </button>
        ))}
      </div>

      {activeTab === "projeto" && <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Dados do projeto</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-semibold">Projeto<input className="mt-1 w-full rounded-xl border p-3 font-normal" value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })}/></label>
          <label className="text-sm font-semibold">Cliente<input className="mt-1 w-full rounded-xl border p-3 font-normal" value={project.client} onChange={(e) => setProject({ ...project, client: e.target.value })}/></label>
          <label className="text-sm font-semibold">Sistema<input className="mt-1 w-full rounded-xl border bg-slate-50 p-3 font-normal" value={project.voltage} readOnly/></label>
          <label className="text-sm font-semibold">Disjuntor geral<select className="mt-1 w-full rounded-xl border p-3 font-normal" value={project.mainBreaker} onChange={(e) => setProject({ ...project, mainBreaker: Number(e.target.value) })}>{breakers.map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900"><b>Fluxo:</b> cadastre os cômodos, informe os pontos e cargas e clique em <b>Gerar projeto elétrico</b>. O sistema separará iluminação, TUG e TUE, balanceará as fases e criará o quadro de cargas.</div>
      </section>}

      {activeTab === "pontos" && <>
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold"><Home className="mr-2 inline"/>Ambientes</h3><button onClick={addRoom} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"><Plus size={17} className="mr-1 inline"/>Ambiente</button></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{rooms.map((r) => <div key={r.id} className="rounded-xl border p-3"><input className="w-full rounded-lg border p-2 font-semibold" value={r.name} onChange={(e) => updateRoom(r.id, "name", e.target.value)}/><label className="mt-2 block text-xs text-slate-500">Área (m²)<input type="number" min="1" className="mt-1 w-full rounded-lg border p-2" value={r.area} onChange={(e) => updateRoom(r.id, "area", e.target.value)}/></label></div>)}</div>
        </section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Pontos e cargas</h3><button onClick={addPoint} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"><Plus size={17} className="mr-1 inline"/>Adicionar ponto</button></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1120px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Ambiente</th><th>Tipo</th><th>Qtd.</th><th>W/ponto</th><th>Tensão</th><th>Distância</th><th>Descrição</th><th/></tr></thead><tbody>{points.map((p) => <tr key={p.id} className="border-b"><td className="p-2"><select className="rounded-lg border p-2" value={p.roomId} onChange={(e) => updatePoint(p.id, "roomId", e.target.value)}>{rooms.map((r) => <option value={r.id} key={r.id}>{r.name}</option>)}</select></td><td><select className="rounded-lg border p-2" value={p.type} onChange={(e) => updatePoint(p.id, "type", e.target.value)}><option>Iluminação</option><option>TUG</option><option>TUE</option></select></td><td><input type="number" min="1" className="w-16 rounded-lg border p-2" value={p.qty} onChange={(e) => updatePoint(p.id, "qty", e.target.value)}/></td><td><input type="number" min="1" className="w-24 rounded-lg border p-2" value={p.watts} onChange={(e) => updatePoint(p.id, "watts", e.target.value)}/></td><td><select className="rounded-lg border p-2" value={p.voltage} onChange={(e) => updatePoint(p.id, "voltage", e.target.value)}><option value="127">127 V</option><option value="220">220 V</option></select></td><td><input type="number" min="1" className="w-20 rounded-lg border p-2" value={p.distance} onChange={(e) => updatePoint(p.id, "distance", e.target.value)}/></td><td><input className="rounded-lg border p-2" value={p.description} onChange={(e) => updatePoint(p.id, "description", e.target.value)}/></td><td><button onClick={() => setPoints((ps) => ps.filter((x) => x.id !== p.id))} className="text-red-600"><Trash2 size={18}/></button></td></tr>)}</tbody></table></div>
        </section>
        <button onClick={() => { setGenerated(true); setActiveTab("resultado"); }} className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-lg font-bold text-white shadow"><WandSparkles className="mr-2 inline"/>Gerar projeto elétrico automaticamente</button>
      </>}

      {activeTab === "resultado" && <>
        <section className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl bg-blue-600 p-5 text-white"><Zap/><div className="mt-2 text-2xl font-bold">{(totalWatts / 1000).toFixed(2)} kW</div><div className="text-sm opacity-80">Carga instalada</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-2xl font-bold">{circuits.length}</div><div className="text-sm text-slate-500">Circuitos</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-2xl font-bold">{rooms.length}</div><div className="text-sm text-slate-500">Ambientes</div></div><div className="rounded-2xl border bg-white p-5"><div className="text-2xl font-bold">{project.mainBreaker} A</div><div className="text-sm text-slate-500">Proteção geral</div></div></section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">Quadro de cargas automático</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">PRÉ-DIMENSIONAMENTO</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Circuito</th><th>Ambientes</th><th>Qtd.</th><th>Carga</th><th>I</th><th>V</th><th>Fase</th><th>Condutor</th><th>Disj.</th><th>ΔV</th></tr></thead><tbody>{circuits.map((c) => <tr key={c.id} className="border-b"><td className="p-2 font-semibold">{c.name}</td><td>{c.rooms.join(", ")}</td><td>{c.points}</td><td>{c.watts} W</td><td>{c.current.toFixed(1)} A</td><td>{c.voltage} V</td><td>{c.phase}</td><td>{c.conductors}</td><td>{c.breaker} A</td><td className={c.drop > 4 ? "font-bold text-red-600" : "text-emerald-600"}>{c.drop.toFixed(2)}%</td></tr>)}</tbody></table></div></section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-bold">Diagrama unifilar simplificado</h3><div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 1100 ${Math.max(300, circuits.length * 82 + 120)}`} className="min-w-[900px] rounded-xl bg-slate-50 p-4"><rect x="30" y="35" width="190" height="72" rx="12" fill="white" stroke="#0f172a"/><text x="125" y="63" textAnchor="middle" fontSize="14" fontWeight="700">ENTRADA 127/220 V</text><text x="125" y="86" textAnchor="middle" fontSize="12">DG {project.mainBreaker} A + DPS + DR</text><line x1="220" y1="71" x2="300" y2="71" stroke="#0f172a" strokeWidth="4"/>{circuits.map((c, i) => { const y = 75 + i * 82; return <g key={c.id}><line x1="300" y1="71" x2="300" y2={y} stroke="#0f172a" strokeWidth="2"/><line x1="300" y1={y} x2="390" y2={y} stroke="#0f172a" strokeWidth="2"/><rect x="390" y={y - 25} width="180" height="50" rx="10" fill="white" stroke="#334155"/><text x="480" y={y - 4} textAnchor="middle" fontSize="12" fontWeight="700">{c.name}</text><text x="480" y={y + 14} textAnchor="middle" fontSize="11">{c.breaker} A • {c.conductors} • {c.phase}</text><line x1="570" y1={y} x2="690" y2={y} stroke="#0f172a" strokeWidth="2"/><text x="705" y={y + 4} fontSize="12">{c.rooms.join(", ")}</text></g>})}</svg></div></section>

        <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-bold"><FileText className="mr-2 inline"/>Lista preliminar de materiais</h3><ul className="mt-4 space-y-2 text-sm">{[
          [`Disjuntores dos circuitos`, `${circuits.length} un.`],
          [`Condutor 1,5 mm²`, `${circuits.filter(c => c.conductors === "1,5 mm²").length} circuito(s)`],
          [`Condutor 2,5 mm² ou superior`, `${circuits.filter(c => c.conductors !== "1,5 mm²").length} circuito(s)`],
          [`Disjuntor geral`, `${project.mainBreaker} A`],
          [`DPS`, `1 conjunto (especificar após análise)`],
          [`DR`, `1 conjunto (dimensionar conforme projeto)`],
          [`Quadro de distribuição`, `${Math.max(12, circuits.length * 2 + 4)} módulos (estimativa)`],
        ].map(([a,b]) => <li key={a} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3"><span>{a}</span><b>{b}</b></li>)}</ul></div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-lg font-bold">Memorial resumido</h3><div className="mt-4 space-y-3 text-sm text-slate-700"><p><b>Projeto:</b> {project.name}</p><p><b>Cliente:</b> {project.client || "Não informado"}</p><p><b>Sistema:</b> 127/220 V bifásico</p><p><b>Carga instalada:</b> {(totalWatts / 1000).toFixed(2)} kW</p><p><b>Ambientes:</b> {rooms.map(r => `${r.name} (${r.area} m²)`).join(" • ")}</p><p><b>Circuitos:</b> {circuits.map(c => `${c.name} — ${c.watts} W`).join("; ")}</p></div></div></section>

        {warnings.length ? <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"><AlertTriangle className="mr-2 inline"/><b>{warnings.length} circuito(s) exigem revisão:</b> verifique queda de tensão, capacidade de condução e coordenação da proteção.</section> : <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><CheckCircle2 className="mr-2 inline"/><b>Verificação preliminar:</b> nenhum alerta de queda de tensão acima de 4% foi identificado pelo cálculo simplificado.</section>}
        <section className="rounded-2xl border bg-amber-50 p-5 text-sm text-amber-900"><b>Nota técnica:</b> este resultado é um pré-dimensionamento. A validação final deve considerar método de instalação, capacidade de condução, agrupamento, temperatura, queda de tensão, curto-circuito, coordenação/seletividade das proteções, DR, DPS, aterramento e demais requisitos aplicáveis da ABNT NBR 5410. O aplicativo não substitui projeto e responsabilidade técnica.</section>
      </>}
    </div>
  );
}