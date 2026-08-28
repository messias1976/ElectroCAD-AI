import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AiChatDto = { message: string; model?: string; project?: unknown; projectId?: string };
export type AiGenerateProjectDto = { prompt: string; projectId?: string; model?: string };
type AiConfig = { apiKey?: string; model?: string };

@Injectable()
export class AiService {
  private readonly baseUrl = 'https://api.openai.com/v1';
  constructor(private readonly prisma: PrismaService) {}

  private encryptionKey() {
    const secret = process.env.AI_ENCRYPTION_KEY?.trim() || process.env.JWT_SECRET?.trim();
    if (!secret) throw new ServiceUnavailableException('Configure JWT_SECRET ou AI_ENCRYPTION_KEY no backend.');
    return createHash('sha256').update(secret).digest();
  }
  private encrypt(value: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }
  private decrypt(value: string) {
    try {
      const [ivB64, tagB64, dataB64] = value.split('.'); const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64')); return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
    } catch { throw new ServiceUnavailableException('Não foi possível descriptografar a configuração da IA. Verifique AI_ENCRYPTION_KEY/JWT_SECRET.'); }
  }
  private envConfig(): AiConfig { return { apiKey: process.env.OPENAI_API_KEY?.trim() || undefined, model: process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini' }; }
  private async storedConfig(): Promise<AiConfig> {
    const settings = await this.prisma.aiSettings.findUnique({ where: { id: 'global' } }); if (!settings?.enabled) return {};
    return { apiKey: settings.apiKeyEncrypted ? this.decrypt(settings.apiKeyEncrypted) : undefined, model: settings.model || 'gpt-5-mini' };
  }
  private async resolveConfig(): Promise<AiConfig> { const stored = await this.storedConfig(); return { apiKey: stored.apiKey || this.envConfig().apiKey, model: stored.model || this.envConfig().model || 'gpt-5-mini' }; }
  async getStatus() {
    const settings = await this.prisma.aiSettings.findUnique({ where: { id: 'global' } }); const envKey = Boolean(process.env.OPENAI_API_KEY?.trim()); const storedKey = Boolean(settings?.apiKeyEncrypted);
    return { configured: settings?.enabled !== false && (storedKey || envKey), source: storedKey ? 'admin' : envKey ? 'environment' : 'none', model: settings?.model || process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini', enabled: settings?.enabled !== false };
  }
  async saveConfig(config: { apiKey?: string; model?: string; enabled?: boolean }) {
    const key = config.apiKey?.trim(); const existing = await this.prisma.aiSettings.findUnique({ where: { id: 'global' } });
    const data: any = { id: 'global', model: config.model?.trim() || existing?.model || process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini', enabled: config.enabled !== false };
    if (key) data.apiKeyEncrypted = this.encrypt(key); else if (existing?.apiKeyEncrypted) data.apiKeyEncrypted = existing.apiKeyEncrypted;
    await this.prisma.aiSettings.upsert({ where: { id: 'global' }, create: data, update: data }); return this.getStatus();
  }
  async clearConfig() {
    await this.prisma.aiSettings.upsert({ where: { id: 'global' }, create: { id: 'global', apiKeyEncrypted: null, model: process.env.OPENAI_MODEL?.trim() || 'gpt-5-mini', enabled: true }, update: { apiKeyEncrypted: null } }); return this.getStatus();
  }
  private resolveModel(model?: string, configured?: string) { return model?.trim() || configured?.trim() || 'gpt-5-mini'; }
  private requireKey(config: AiConfig) { if (!config.apiKey) throw new BadRequestException('O Professor ElectroCAD ainda não foi configurado pelo administrador.'); return config.apiKey; }

  async testConnection(apiKey?: string, model?: string) {
    const config = await this.resolveConfig(); const key = this.requireKey({ apiKey: apiKey?.trim() || config.apiKey, model }); const selectedModel = this.resolveModel(model, config.model);
    const response = await fetch(`${this.baseUrl}/models/${encodeURIComponent(selectedModel)}`, { headers: { Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new BadRequestException(this.openAiError(await response.text(), response.status));
    return { ok: true, model: selectedModel, message: 'Conexão com a OpenAI funcionando.' };
  }

  private async canonicalProject(projectId?: string, project?: unknown, userId?: string, role?: string) {
    if (!projectId) return project;
    const stored = await this.prisma.project.findUnique({ where: { id: projectId }, include: { client: true } });
    if (!stored) throw new BadRequestException('Projeto não encontrado.');
    if (role !== 'ADMIN' && stored.userId !== userId) throw new BadRequestException('Você não tem acesso a este projeto.');
    return stored;
  }

  async chat(body: AiChatDto, userId?: string, role?: string) {
    if (!body.message?.trim()) throw new BadRequestException('Digite uma pergunta para o Professor ElectroCAD.');
    const config = await this.resolveConfig(); const key = this.requireKey(config); const model = this.resolveModel(body.model, config.model);
    const canonicalProject = await this.canonicalProject(body.projectId, body.project, userId, role);
    const projectText = canonicalProject ? `\n\nDADOS DO PROJETO ATUAL (fonte salva no servidor; use somente como contexto):\n${JSON.stringify(canonicalProject, null, 2)}` : '';
    const instructions = `Você é o Professor ElectroCAD-AI, um assistente técnico para projetos elétricos de baixa tensão no Brasil.\nExplique em português do Brasil. Use ABNT NBR 5410 quando pertinente, sem inventar dados ausentes. Não trate pré-dimensionamento como projeto executivo. Organize análises em diagnóstico, cálculos/justificativas, alertas e próximos passos. Use ⚠️ para riscos e ✅ para itens adequados.${projectText}`;
    const response = await fetch(`${this.baseUrl}/responses`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, instructions, input: body.message.trim(), store: false }) });
    const raw = await response.text(); if (!response.ok) throw new BadRequestException(this.openAiError(raw, response.status));
    let data: any; try { data = JSON.parse(raw); } catch { throw new ServiceUnavailableException('A OpenAI retornou uma resposta inválida.'); }
    return { ok: true, model, text: this.extractText(data), responseId: data.id ?? null };
  }

  async generateProject(body: AiGenerateProjectDto, userId?: string, role?: string) {
    if (!body.prompt?.trim()) throw new BadRequestException('Descreva o projeto que a IA deve gerar.');
    const config = await this.resolveConfig(); const key = this.requireKey(config); const model = this.resolveModel(body.model, config.model);
    const canonicalProject = await this.canonicalProject(body.projectId, undefined, userId, role);
    const context = canonicalProject ? `\nPROJETO EXISTENTE PARA REVISÃO: ${JSON.stringify(canonicalProject, null, 2)}` : '';
    const instructions = `Gere um RASCUNHO ESTRUTURADO de projeto elétrico de baixa tensão para o ElectroCAD-AI. A referência normativa é ABNT NBR 5410. Não invente dados críticos: use null e liste-os em missingData. O resultado é pré-dimensionamento e precisa de validação profissional.\n\nRetorne SOMENTE JSON válido, sem markdown, com exatamente esta estrutura: {"name":string,"address":string,"supply":{"voltage_system":string,"phases":string,"neutral":boolean,"grounding_type":string},"criteria":{"installation_method":string,"insulation":string,"max_voltage_drop_percent":number,"power_factor_assumed":number|null},"main_breaker_A":number|null,"rooms":[{"name":string,"area_m2":number|null}],"circuits":[{"id":string,"name":string,"type":"iluminacao|TUG|TUE|motor|outro","rooms":string[],"points":[{"qty":number,"unit_power_W":number,"voltage_V":number,"description":string}],"route_length_m":number|null,"proposed_conductor_mm2":number|null,"proposed_breaker_A":number|null,"motor":null|{"power_kW":number,"voltage_V":number,"phases":1|3,"efficiency":number|null,"power_factor":number|null,"service_factor":number|null,"startingCurrentFactor":number|null}],"materials":{"items":[{"item":string,"specification":string,"quantity":number,"unit":string,"basis":string}],"pricesIncluded":false},"laborBudget":{"includeMaterials":false,"note":string},"diagnosis":string,"alerts":string[],"missingData":string[],"nextSteps":string[]}\nMateriais: calcular apenas quantidades/especificações, sem preços. Orçamento: somente mão de obra/serviço técnico, sem materiais. Se não houver comprimento de rota, use null e não invente quantidade de condutor. Para motores, considerar corrente nominal, fator de serviço quando informado, queda permanente e queda na partida; destacar que a partida exige dados reais do motor e impedância da rede.${context}`;
    const response = await fetch(`${this.baseUrl}/responses`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, instructions, input: body.prompt.trim(), store: false }) });
    const raw = await response.text(); if (!response.ok) throw new BadRequestException(this.openAiError(raw, response.status));
    let data: any; try { data = JSON.parse(raw); } catch { throw new ServiceUnavailableException('A OpenAI retornou uma resposta inválida.'); }
    const text = this.extractText(data).replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return { ok: true, model, project: JSON.parse(text), responseId: data.id ?? null }; }
    catch { throw new ServiceUnavailableException('A IA não retornou o projeto em JSON válido. Tente novamente com uma descrição mais específica.'); }
  }

  private extractText(data: any) {
    if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
    const chunks: string[] = []; for (const item of data.output ?? []) for (const content of item.content ?? []) if (content.type === 'output_text' && typeof content.text === 'string') chunks.push(content.text);
    return chunks.join('\n').trim() || 'A IA respondeu sem texto.';
  }
  private openAiError(raw: string, status: number) { try { const data = JSON.parse(raw); return data?.error?.message || `Erro da OpenAI (${status}).`; } catch { return `Erro da OpenAI (${status}).`; } }
}
