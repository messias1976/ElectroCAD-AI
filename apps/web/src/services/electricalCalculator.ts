export type CircuitPoint = {
  qty: number;
  unit_power_W: number;
  voltage_V: number;
  description?: string;
};

export type CircuitInput = {
  id: string;
  name: string;
  type: string;
  rooms: string[];
  points: CircuitPoint[];
  route_length_m: number;
  proposed_conductor_mm2?: number | null;
  proposed_breaker_A?: number | null;
  power_factor?: number | null;
};

export type DimensioningInput = {
  name: string;
  address?: string;
  supply: { voltage_system: string; phases: string; neutral: boolean; grounding_type: string };
  main_breaker?: number | null;
  ambient_temperature_c?: number;
  criteria?: { installation_method?: string; insulation?: string; max_voltage_drop_percent?: number; power_factor_assumed?: number | null };
  circuits: CircuitInput[];
  requirements?: { rccbs?: { required: boolean; sensitivity_mA?: number | null } };
};

const BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100];
// Reference values for Cu/PVC 70 °C, method B1, 30 °C, from the NBR 5410 Table 36 data used for preliminary calculations.
const B1_2C = new Map<number, number>([[1.5, 17.5], [2.5, 24], [4, 32], [6, 41], [10, 57], [16, 76], [25, 101], [35, 125], [50, 151]]);
const RESISTANCE_OHM_M_20C = new Map<number, number>([[1.5, 0.0121], [2.5, 0.00741], [4, 0.00461], [6, 0.00308], [10, 0.00183], [16, 0.00115], [25, 0.000727], [35, 0.000524], [50, 0.000387]]);

function round(value: number, digits = 2) { const p = 10 ** digits; return Math.round(value * p) / p; }
function nextBreaker(ib: number) { return BREAKERS.find(v => v >= ib) ?? null; }
function nextSection(ib: number, breaker: number) {
  for (const section of [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50]) {
    const iz = B1_2C.get(section) ?? 0;
    if (iz >= breaker && iz >= ib) return section;
  }
  return null;
}

export function calculateCircuit(circuit: CircuitInput, defaults?: DimensioningInput['criteria']) {
  const pf = circuit.power_factor ?? defaults?.power_factor_assumed ?? 1;
  const totalPower = circuit.points.reduce((sum, p) => sum + Math.max(0, p.qty) * Math.max(0, p.unit_power_W), 0);
  const voltage = circuit.points[0]?.voltage_V || 127;
  const ib = totalPower / Math.max(1, voltage * Math.max(0.8, pf));
  const breaker = circuit.proposed_breaker_A ?? nextBreaker(ib);
  const section = circuit.proposed_conductor_mm2 ?? (breaker ? nextSection(ib, breaker) : null);
  const iz = section ? B1_2C.get(section) ?? null : null;
  const resistance = section ? RESISTANCE_OHM_M_20C.get(section) ?? null : null;
  const dv = resistance && circuit.route_length_m > 0 ? 2 * circuit.route_length_m * ib * resistance : null;
  const dvPercent = dv == null ? null : (dv / voltage) * 100;
  const limit = defaults?.max_voltage_drop_percent ?? 4;
  const breakerOk = breaker != null && (breaker >= ib);
  const conductorOk = iz != null && breaker != null && iz >= breaker;
  const dropOk = dvPercent == null || dvPercent <= limit;
  const ok = Boolean(breakerOk && conductorOk && dropOk);
  const alerts: string[] = [];
  if (!breaker) alerts.push('Não foi possível selecionar um disjuntor padrão para a corrente calculada.');
  if (!section || iz == null) alerts.push('Seção/Iz não disponível na tabela preliminar. Confirmar pela tabela normativa e condições reais.');
  if (breaker != null && iz != null && iz < breaker) alerts.push(`Iz (${round(iz)} A) é inferior ao disjuntor (${breaker} A); aumentar a seção.`);
  if (dvPercent != null && dvPercent > limit) alerts.push(`Queda de tensão de ${round(dvPercent)}% excede o limite informado de ${limit}%.`);
  if (!circuit.power_factor && !defaults?.power_factor_assumed) alerts.push('Fator de potência não informado; foi usado 1,0 apenas para pré-dimensionamento.');
  return { id: circuit.id, name: circuit.name, type: circuit.type, totalPower_W: round(totalPower), voltage_V: voltage, powerFactor: pf, ib_A: round(ib), breaker_A: breaker, breakerCurve: 'B/C a confirmar conforme carga e curto-circuito', conductor_mm2: section, iz_A: iz == null ? null : round(iz), resistance_ohm_m: resistance, voltageDrop_V: dv == null ? null : round(dv), voltageDropPercent: dvPercent == null ? null : round(dvPercent), voltageDropLimitPercent: limit, ok, alerts };
}

export function calculateDimensioning(input: DimensioningInput) {
  const circuits = input.circuits.map(c => calculateCircuit(c, input.criteria));
  const totalPower_W = circuits.reduce((s, c) => s + c.totalPower_W, 0);
  const maxVoltage = circuits.reduce((s, c) => Math.max(s, c.voltage_V), 0) || 127;
  const totalCurrent_A = totalPower_W / Math.max(1, maxVoltage * Math.max(0.8, input.criteria?.power_factor_assumed ?? 1));
  const alerts = circuits.flatMap(c => c.alerts);
  if (!input.main_breaker) alerts.push('Disjuntor geral não informado; calcular após confirmação da demanda e padrão de entrada.');
  if (input.supply.grounding_type !== 'TN-C-S') alerts.push(`Aterramento informado como ${input.supply.grounding_type}; confirmar esquema real no local.`);
  alerts.push('Corrente de curto-circuito disponível, seletividade, agrupamento e fatores térmicos precisam ser confirmados antes do projeto executivo.');
  return { diagnosis: alerts.length === 1 ? 'Pré-dimensionamento com ressalvas.' : 'Pré-dimensionamento concluído com verificações pendentes.', totalPower_W: round(totalPower_W), totalPower_kW: round(totalPower_W / 1000), totalCurrent_A: round(totalCurrent_A), circuits, alerts: [...new Set(alerts)], rccb: input.requirements?.rccbs?.required ? { required: true, sensitivity_mA: input.requirements.rccbs.sensitivity_mA ?? 30 } : { required: false, sensitivity_mA: null }, disclaimer: 'Pré-dimensionamento. Validar por profissional habilitado e pelas condições reais da instalação conforme ABNT NBR 5410.' };
}

export type BudgetInput = { rooms: number; points: number; circuits: number; hasPlant: boolean; hasDimensioning: boolean; hasUnifilar: boolean; hasMaterialsList?: boolean };
export function estimateServiceBudget(input: BudgetInput) {
  const base = 250;
  const room = Math.max(0, input.rooms) * 45;
  const point = Math.max(0, input.points) * 12;
  const circuit = Math.max(0, input.circuits) * 55;
  const plant = input.hasPlant ? 250 : 0;
  const dimensioning = input.hasDimensioning ? 300 : 0;
  const unifilar = input.hasUnifilar ? 180 : 0;
  const materials = input.hasMaterialsList ? 180 : 0;
  const suggested = base + room + point + circuit + plant + dimensioning + unifilar + materials;
  return { suggested: round(suggested), rangeMin: round(suggested * 0.85), rangeMax: round(suggested * 1.25), breakdown: { base, room, point, circuit, plant, dimensioning, unifilar, materials }, note: 'Estimativa comercial do serviço de projeto/pré-dimensionamento; não inclui materiais, execução, ART/RRT ou taxas.' };
}
