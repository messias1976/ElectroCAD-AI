export type CircuitPoint = {
  qty: number;
  unit_power_W: number;
  voltage_V: number;
  description?: string;
};

export type MotorInput = {
  power_kW: number;
  voltage_V: number;
  phases: 1 | 3;
  efficiency?: number | null;
  power_factor?: number | null;
  service_factor?: number | null;
  lockedRotorCurrent_A?: number | null;
  startingCurrentFactor?: number | null;
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
  motor?: MotorInput | null;
};

export type DimensioningInput = {
  name: string;
  address?: string;
  supply: { voltage_system: string; phases: string; neutral: boolean; grounding_type: string };
  main_breaker?: number | null;
  ambient_temperature_c?: number;
  criteria?: {
    installation_method?: string;
    insulation?: string;
    max_voltage_drop_percent?: number;
    power_factor_assumed?: number | null;
    temperature_correction_factor?: number;
    grouping_correction_factor?: number;
  };
  circuits: CircuitInput[];
  requirements?: { rccbs?: { required: boolean; sensitivity_mA?: number | null } };
};

const BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100];
const SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50];
// Reference values for Cu/PVC 70 °C, method B1, 30 °C. They are used only as a calculation baseline.
const B1_2C = new Map<number, number>([[1.5, 17.5], [2.5, 24], [4, 32], [6, 41], [10, 57], [16, 76], [25, 101], [35, 125], [50, 151]]);
const RESISTANCE_OHM_M_20C = new Map<number, number>([[1.5, 0.0121], [2.5, 0.00741], [4, 0.00461], [6, 0.00308], [10, 0.00183], [16, 0.00115], [25, 0.000727], [35, 0.000524], [50, 0.000387]]);

function round(value: number, digits = 2) { const p = 10 ** digits; return Math.round(value * p) / p; }
function positive(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, n) : fallback; }
function nextBreaker(ib: number) { return BREAKERS.find(v => v >= ib) ?? null; }
function minimumSectionForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('luz') || normalized.includes('ilum')) return 1.5;
  if (normalized.includes('tug') || normalized.includes('tomada')) return 2.5;
  return 1.5;
}
function nextSection(ib: number, breaker: number, minSection = 1.5, correction = 1) {
  for (const section of SECTIONS) {
    if (section < minSection) continue;
    const iz = (B1_2C.get(section) ?? 0) * correction;
    if (iz >= breaker && iz >= ib) return section;
  }
  return null;
}
function motorNominalCurrent(motor: MotorInput) {
  const efficiency = Math.min(1, Math.max(0.01, motor.efficiency ?? 0.9));
  const pf = Math.min(1, Math.max(0.1, motor.power_factor ?? 0.85));
  const powerW = positive(motor.power_kW) * 1000;
  return motor.phases === 3
    ? powerW / (Math.sqrt(3) * Math.max(1, motor.voltage_V) * efficiency * pf)
    : powerW / (Math.max(1, motor.voltage_V) * efficiency * pf);
}

export function calculateCircuit(circuit: CircuitInput, defaults?: DimensioningInput['criteria']) {
  const isMotor = Boolean(circuit.motor) || circuit.type.toLowerCase().includes('motor');
  const pf = circuit.motor?.power_factor ?? circuit.power_factor ?? defaults?.power_factor_assumed ?? (isMotor ? 0.85 : 1);
  const totalPower = circuit.motor
    ? positive(circuit.motor.power_kW) * 1000
    : circuit.points.reduce((sum, p) => sum + positive(p.qty) * positive(p.unit_power_W), 0);
  const voltage = circuit.motor?.voltage_V || circuit.points[0]?.voltage_V || 127;
  const motorIb = circuit.motor ? motorNominalCurrent(circuit.motor) : null;
  const ib = motorIb ?? totalPower / Math.max(1, voltage * Math.max(0.8, pf));
  const serviceFactor = circuit.motor?.service_factor && circuit.motor.service_factor > 1 ? circuit.motor.service_factor : 1;
  const designCurrent = ib * serviceFactor;
  const breaker = circuit.proposed_breaker_A ?? nextBreaker(designCurrent);
  const correction = Math.max(0.1, (defaults?.temperature_correction_factor ?? 1) * (defaults?.grouping_correction_factor ?? 1));
  const minSection = minimumSectionForType(circuit.type);
  const section = circuit.proposed_conductor_mm2 ?? (breaker ? nextSection(designCurrent, breaker, minSection, correction) : null);
  const izBase = section ? B1_2C.get(section) ?? null : null;
  const iz = izBase == null ? null : izBase * correction;
  const resistance = section ? RESISTANCE_OHM_M_20C.get(section) ?? null : null;
  const phaseCount = circuit.motor?.phases === 3 ? 3 : 1;
  const dv = resistance && circuit.route_length_m > 0
    ? (phaseCount === 3 ? Math.sqrt(3) : 2) * circuit.route_length_m * designCurrent * resistance
    : null;
  const dvPercent = dv == null ? null : (dv / voltage) * 100;
  const limit = defaults?.max_voltage_drop_percent ?? 4;
  const startingCurrent = circuit.motor
    ? positive(circuit.motor.lockedRotorCurrent_A, designCurrent * (circuit.motor.startingCurrentFactor ?? 6))
    : null;
  const startDv = resistance && startingCurrent != null && circuit.route_length_m > 0
    ? (phaseCount === 3 ? Math.sqrt(3) : 2) * circuit.route_length_m * startingCurrent * resistance
    : null;
  const startDvPercent = startDv == null ? null : (startDv / voltage) * 100;
  const breakerOk = breaker != null && breaker >= designCurrent;
  const conductorOk = iz != null && breaker != null && iz >= breaker;
  const dropOk = dvPercent == null || dvPercent <= limit;
  const motorStartOk = !isMotor || startDvPercent == null || startDvPercent <= 10;
  const ok = Boolean(breakerOk && conductorOk && dropOk && motorStartOk);
  const alerts: string[] = [];
  if (!breaker) alerts.push('Não foi possível selecionar um disjuntor padrão para a corrente calculada.');
  if (!section || iz == null) alerts.push('Seção/Iz não disponível na tabela de referência. Confirmar pela tabela normativa e condições reais.');
  if (breaker != null && iz != null && iz < breaker) alerts.push(`Iz corrigida (${round(iz)} A) é inferior ao disjuntor (${breaker} A); aumentar a seção ou rever proteção.`);
  if (dvPercent != null && dvPercent > limit) alerts.push(`Queda de tensão de ${round(dvPercent)}% excede o limite informado de ${limit}%.`);
  if (isMotor && startDvPercent != null && startDvPercent > 10) alerts.push(`Queda estimada na partida de ${round(startDvPercent)}% excede 10%; avaliar método de partida, seção e impedâncias reais.`);
  if (isMotor && positive(circuit.motor?.power_kW) > 3.7) alerts.push('Motor acima de 3,7 kW (5 CV): verificar exigências da distribuidora e método de partida antes do projeto executivo.');
  if (defaults?.temperature_correction_factor == null && (defaults?.installation_method || '').includes('B1')) alerts.push('Fator de correção de temperatura não informado; foi adotado 1,0 (condição de referência) para o pré-dimensionamento.');
  if (defaults?.grouping_correction_factor == null && (defaults?.installation_method || '').includes('B1')) alerts.push('Fator de agrupamento não informado; foi adotado 1,0. Confirmar número de circuitos agrupados.');
  const breakerCurve = isMotor ? 'C/D a confirmar' : circuit.type.toLowerCase().includes('luz') ? 'B' : 'B/C a confirmar';
  return {
    id: circuit.id, name: circuit.name, type: circuit.type, totalPower_W: round(totalPower), voltage_V: voltage, powerFactor: pf,
    ib_A: round(ib), serviceFactor, designCurrent_A: round(designCurrent), breaker_A: breaker, breakerCurve,
    conductor_mm2: section, izBase_A: izBase == null ? null : round(izBase), iz_A: iz == null ? null : round(iz),
    correctionFactor: round(correction), resistance_ohm_m: resistance,
    voltageDrop_V: dv == null ? null : round(dv), voltageDropPercent: dvPercent == null ? null : round(dvPercent), voltageDropLimitPercent: limit,
    startingCurrent_A: startingCurrent == null ? null : round(startingCurrent), startingVoltageDrop_V: startDv == null ? null : round(startDv), startingVoltageDropPercent: startDvPercent == null ? null : round(startDvPercent),
    motor: isMotor ? { power_kW: circuit.motor?.power_kW ?? totalPower / 1000, phases: circuit.motor?.phases ?? 1, efficiency: circuit.motor?.efficiency ?? 0.9, powerFactor: circuit.motor?.power_factor ?? 0.85, startingCurrentFactor: circuit.motor?.startingCurrentFactor ?? 6, startingDropLimitPercent: 10 } : null,
    ok, alerts,
  };
}

export function calculateDimensioning(input: DimensioningInput) {
  const circuits = input.circuits.map(c => calculateCircuit(c, input.criteria));
  const totalPower_W = circuits.reduce((s, c) => s + c.totalPower_W, 0);
  const maxVoltage = circuits.reduce((s, c) => Math.max(s, c.voltage_V), 0) || 127;
  const totalCurrent_A = totalPower_W / Math.max(1, maxVoltage * Math.max(0.8, input.criteria?.power_factor_assumed ?? 1));
  const alerts = circuits.flatMap(c => c.alerts);
  if (!input.main_breaker) alerts.push('Disjuntor geral não informado; calcular após confirmação da demanda e padrão de entrada.');
  if (input.supply.grounding_type !== 'TN-C-S') alerts.push(`Aterramento informado como ${input.supply.grounding_type}; confirmar esquema real no local.`);
  if (input.requirements?.rccbs?.required) alerts.push(`DR de alta sensibilidade ${input.requirements.rccbs.sensitivity_mA ?? 30} mA solicitado; confirmar circuitos protegidos, seletividade e instalação no quadro.`);
  alerts.push('Corrente de curto-circuito disponível, seletividade, agrupamento e fatores térmicos precisam ser confirmados antes do projeto executivo.');
  return {
    diagnosis: alerts.length === 1 ? 'Pré-dimensionamento com ressalvas.' : 'Pré-dimensionamento concluído com verificações pendentes.',
    totalPower_W: round(totalPower_W), totalPower_kW: round(totalPower_W / 1000), totalCurrent_A: round(totalCurrent_A),
    circuits, alerts: [...new Set(alerts)],
    rccb: input.requirements?.rccbs?.required ? { required: true, sensitivity_mA: input.requirements.rccbs.sensitivity_mA ?? 30 } : { required: false, sensitivity_mA: null },
    materialSchedule: calculateMaterialSchedule(input.circuits, circuits, input.requirements?.rccbs?.required ?? false),
    disclaimer: 'Pré-dimensionamento. Validar por profissional habilitado e pelas condições reais da instalação conforme ABNT NBR 5410 e demais normas aplicáveis.',
  };
}

export type MaterialItem = { category: string; item: string; specification: string; quantity: number; unit: string; basis: string };
export function calculateMaterialSchedule(inputs: CircuitInput[], results: ReturnType<typeof calculateCircuit>[], rccbRequired = false): MaterialItem[] {
  const items: MaterialItem[] = [];
  const add = (category: string, item: string, specification: string, quantity: number, unit: string, basis: string) => {
    if (quantity > 0) items.push({ category, item, specification, quantity: round(quantity), unit, basis });
  };
  let totalConduit = 0;
  const phaseBySection = new Map<number, number>();
  const neutralBySection = new Map<number, number>();
  const peBySection = new Map<number, number>();
  inputs.forEach((circuit, index) => {
    const result = results[index];
    if (!result || !result.conductor_mm2 || circuit.route_length_m <= 0) return;
    const length = circuit.route_length_m * 1.1;
    totalConduit += length;
    const section = result.conductor_mm2;
    const isThreePhase = circuit.motor?.phases === 3;
    const phaseConductors = isThreePhase ? 3 : 1;
    const neutralConductors = isThreePhase ? 1 : (result.voltage_V === 127 ? 1 : 0);
    const phaseQty = length * phaseConductors;
    phaseBySection.set(section, (phaseBySection.get(section) ?? 0) + phaseQty);
    if (neutralConductors) { const q = length * neutralConductors; neutralBySection.set(section, (neutralBySection.get(section) ?? 0) + q); }
    const peSection = section <= 16 ? section : section <= 35 ? 16 : section / 2;
    peBySection.set(peSection, (peBySection.get(peSection) ?? 0) + length);
    const pointQty = circuit.points.reduce((s, p) => s + positive(p.qty), 0);
    add('Pontos', circuit.type.toLowerCase().includes('luz') ? 'Ponto de iluminação' : 'Ponto de tomada/equipamento', circuit.type, pointQty, 'un', `Quantidade de pontos do ${circuit.id}`);
    add('Proteção', 'Disjuntor termomagnético', `${result.breaker_A ?? 'a definir'} A curva ${result.breakerCurve}`, 1, 'un', `${circuit.id}`);
  });
  phaseBySection.forEach((q, section) => add('Condutores', 'Condutor de fase', `Cobre ${section} mm², PVC 70 °C`, q, 'm', 'Comprimento de rota + 10% de reserva'));
  neutralBySection.forEach((q, section) => add('Condutores', 'Condutor de neutro', `Cobre ${section} mm², PVC 70 °C`, q, 'm', 'Circuitos com neutro'));
  peBySection.forEach((q, section) => add('Condutores', 'Condutor de proteção (PE)', `Cobre ${section} mm², verde/verde-amarelo`, q, 'm', 'Estimativa conforme seção de fase'));
  add('Infraestrutura', 'Eletroduto', 'Diâmetro a dimensionar conforme ocupação e número de condutores', totalConduit, 'm', 'Rotas dos circuitos + 10% de reserva');
  add('Proteção', 'DR alta sensibilidade', `${rccbRequired ? 30 : 'conforme projeto'} mA`, rccbRequired ? 1 : 0, 'un', 'Requisito informado para o projeto');
  add('Quadro', 'Espaço para disjuntores', 'Módulos DIN; quantidade deve considerar disjuntores, DR e DPS', results.filter(r => r.breaker_A != null).length, 'módulos (mín.)', 'Confirmar largura real dos dispositivos');
  add('Documentação', 'Identificação de circuitos', 'Etiquetas/identificação no quadro', results.length, 'un', 'Um por circuito');
  return items;
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
  const suggested = base + room + point + circuit + plant + dimensioning + unifilar;
  return {
    suggested: round(suggested), rangeMin: round(suggested * 0.85), rangeMax: round(suggested * 1.25),
    breakdown: { base, room, point, circuit, plant, dimensioning, unifilar },
    note: 'Orçamento comercial referente somente à mão de obra/serviço técnico. Não inclui materiais, execução, compra em loja, ART/RRT ou taxas.',
  };
}
