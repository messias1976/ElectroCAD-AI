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
// Baseline values for Cu/PVC 70 °C, method B1, 30 °C. They are only a pre-dimensioning reference.
const B1_2C = new Map<number, number>([[1.5, 17.5], [2.5, 24], [4, 32], [6, 41], [10, 57], [16, 76], [25, 101], [35, 125], [50, 151]]);
const RESISTANCE_OHM_M_20C = new Map<number, number>([[1.5, 0.0121], [2.5, 0.00741], [4, 0.00461], [6, 0.00308], [10, 0.00183], [16, 0.00115], [25, 0.000727], [35, 0.000524], [50, 0.000387]]);

function round(value: number, digits = 2) { const p = 10 ** digits; return Math.round(value * p) / p; }
function positive(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, n) : fallback; }
function isLighting(type: string) { const n = type.toLowerCase(); return n.includes('luz') || n.includes('ilum'); }
function isTug(type: string) { const n = type.toLowerCase(); return n.includes('tug') || n.includes('tomada'); }
function isMotorType(type: string) { return type.toLowerCase().includes('motor'); }
function minimumSectionForType(type: string) { if (isLighting(type)) return 1.5; return isTug(type) ? 2.5 : 2.5; }
function nextBreakerForCircuit(current: number, type: string) {
  const minimum = isLighting(type) ? 10 : isTug(type) ? 16 : 6;
  const target = Math.max(current * 1.25, minimum);
  return BREAKERS.find(v => v >= target) ?? null;
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
  const isMotor = Boolean(circuit.motor) || isMotorType(circuit.type);
  const pf = circuit.motor?.power_factor ?? circuit.power_factor ?? defaults?.power_factor_assumed ?? (isMotor ? 0.85 : 1);
  const totalPower = circuit.motor
    ? positive(circuit.motor.power_kW) * 1000
    : circuit.points.reduce((sum, p) => sum + positive(p.qty) * positive(p.unit_power_W), 0);
  const voltage = circuit.motor?.voltage_V || circuit.points[0]?.voltage_V || 127;
  const motorIb = circuit.motor ? motorNominalCurrent(circuit.motor) : null;
  const ib = motorIb ?? totalPower / Math.max(1, voltage * Math.max(0.8, pf));
  const serviceFactor = circuit.motor?.service_factor && circuit.motor.service_factor > 1 ? circuit.motor.service_factor : 1;
  const designCurrent = ib * serviceFactor;
  const breaker = circuit.proposed_breaker_A ?? nextBreakerForCircuit(designCurrent, circuit.type);
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
  if (defaults?.temperature_correction_factor == null && (defaults?.installation_method || '').includes('B1')) alerts.push('Fator de correção de temperatura não informado; foi adotado 1,0 para o pré-dimensionamento.');
  if (defaults?.grouping_correction_factor == null && (defaults?.installation_method || '').includes('B1')) alerts.push('Fator de agrupamento não informado; foi adotado 1,0. Confirmar número de circuitos agrupados.');
  const breakerCurve = isMotor ? 'C/D a confirmar' : isLighting(circuit.type) ? 'B' : 'B/C a confirmar';
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
  // For mixed 127/220 V projects, summing circuit currents is a conservative project indicator,
  // not a substitute for the demand/balance calculation of the supply feeder.
  const totalPower_W = circuits.reduce((s, c) => s + c.totalPower_W, 0);
  const totalCurrent_A = circuits.reduce((s, c) => s + c.designCurrent_A, 0);
  const alerts = circuits.flatMap(c => c.alerts);
  if (!input.main_breaker) alerts.push('Disjuntor geral não informado; calcular após confirmação da demanda e padrão de entrada.');
  if (input.supply.grounding_type !== 'TN-C-S') alerts.push(`Aterramento informado como ${input.supply.grounding_type}; confirmar esquema real no local.`);
  if (input.requirements?.rccbs?.required) alerts.push(`DR de alta sensibilidade ${input.requirements.rccbs.sensitivity_mA ?? 30} mA solicitado; confirmar circuitos protegidos, seletividade e instalação no quadro.`);
  alerts.push('Corrente de curto-circuito disponível, seletividade, agrupamento, balanceamento de fases e fatores térmicos precisam ser confirmados antes do projeto executivo.');
  return {
    diagnosis: 'Pré-dimensionamento concluído com verificações pendentes.',
    totalPower_W: round(totalPower_W), totalPower_kW: round(totalPower_W / 1000), totalCurrent_A: round(totalCurrent_A),
    circuits, alerts: [...new Set(alerts)],
    rccb: input.requirements?.rccbs?.required ? { required: true, sensitivity_mA: input.requirements.rccbs.sensitivity_mA ?? 30 } : { required: false, sensitivity_mA: null },
    materialSchedule: calculateMaterialSchedule(input.circuits, circuits, input.requirements?.rccbs?.required ?? false, input.main_breaker ?? null, input.supply),
    disclaimer: 'Pré-dimensionamento. Validar por profissional habilitado e pelas condições reais da instalação conforme ABNT NBR 5410 e demais normas aplicáveis.',
  };
}

export type MaterialItem = { category: string; item: string; specification: string; quantity: number; unit: string; basis: string };
export function calculateMaterialSchedule(
  inputs: CircuitInput[],
  results: ReturnType<typeof calculateCircuit>[],
  rccbRequired = false,
  mainBreaker: number | null = null,
  supply?: DimensioningInput['supply'],
): MaterialItem[] {
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
    if (!result) return;
    const length = Math.max(0, positive(circuit.route_length_m)) * 1.1;
    if (result.conductor_mm2 && length > 0) {
      totalConduit += length;
      const section = result.conductor_mm2;
      const isThreePhase = circuit.motor?.phases === 3;
      const phaseConductors = isThreePhase ? 3 : 1;
      const neutralConductors = isThreePhase ? 1 : (result.voltage_V === 127 ? 1 : 0);
      phaseBySection.set(section, (phaseBySection.get(section) ?? 0) + length * phaseConductors);
      if (neutralConductors) neutralBySection.set(section, (neutralBySection.get(section) ?? 0) + length * neutralConductors);
      const peSection = section <= 16 ? section : section <= 35 ? 16 : section / 2;
      peBySection.set(peSection, (peBySection.get(peSection) ?? 0) + length);
    }
    const pointQty = circuit.points.reduce((s, p) => s + positive(p.qty), 0);
    add('Pontos', isLighting(circuit.type) ? 'Ponto de iluminação' : 'Ponto de tomada/equipamento', circuit.type, pointQty, 'un', `Quantidade informada do ${circuit.id}`);
    add('Proteção', 'Disjuntor termomagnético', `${result.breaker_A ?? 'a definir'} A, curva ${result.breakerCurve}`, 1, 'un', `Proteção do ${circuit.id}`);
  });
  phaseBySection.forEach((q, section) => add('Condutores', 'Condutor de fase', `Cobre ${section} mm², PVC 70 °C`, q, 'm', 'Rota dos circuitos + 10% de reserva'));
  neutralBySection.forEach((q, section) => add('Condutores', 'Condutor de neutro', `Cobre ${section} mm², PVC 70 °C, azul-claro`, q, 'm', 'Circuitos em 127 V + 10% de reserva'));
  peBySection.forEach((q, section) => add('Condutores', 'Condutor de proteção (PE)', `Cobre ${section} mm², verde/verde-amarelo`, q, 'm', 'Estimativa da seção do PE + 10% de reserva'));
  add('Infraestrutura', 'Eletroduto', 'Diâmetro a dimensionar pela ocupação e número de condutores', totalConduit, 'm', 'Rotas dos circuitos + 10% de reserva');
  add('Proteção', 'Disjuntor geral', `${mainBreaker ?? 'a definir'} A, número de polos conforme sistema de alimentação`, mainBreaker ? 1 : 0, 'un', 'Proteção geral informada');
  add('Proteção', 'DR alta sensibilidade', `${rccbRequired ? 30 : 'a definir'} mA, polos conforme sistema`, rccbRequired ? 1 : 0, 'un', 'Requisito informado para o projeto');
  const supplyLabel = supply?.voltage_system || 'sistema informado';
  add('Proteção', 'DPS Classe II', `Tensão e esquema de ligação compatíveis com ${supplyLabel}`, 1, 'conjunto', 'Proteção contra surtos — especificar após análise do sistema');
  add('Quadro', 'Quadro de distribuição', 'Mínimo estimado: 12 módulos DIN, ajustar após definição dos dispositivos e reserva', 1, 'un', 'Estimativa para acomodar circuitos + proteção geral + DR + DPS + reserva');
  add('Quadro', 'Barramento de neutro', 'Barramento DIN compatível com o quadro', 1, 'un', 'Conforme número de circuitos');
  add('Quadro', 'Barramento de terra (PE)', 'Barramento DIN compatível com o quadro', 1, 'un', 'Conforme número de circuitos');
  add('Quadro', 'Identificação de circuitos', 'Etiquetas/identificação no quadro', results.length, 'un', 'Uma identificação por circuito');
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
    note: 'Orçamento comercial referente somente à mão de obra/serviço técnico. Não inclui materiais, compra em loja, execução física, ART/RRT ou taxas.',
  };
}
