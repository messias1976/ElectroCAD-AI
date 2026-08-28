import { apiFetch } from './api';

export const AI_KEY_STORAGE = 'electrocad-openai-key';
export const AI_MODEL_STORAGE = 'electrocad-openai-model';

export function getAiConfig() {
  return { apiKey: sessionStorage.getItem(AI_KEY_STORAGE) ?? '', model: sessionStorage.getItem(AI_MODEL_STORAGE) ?? 'gpt-5-mini' };
}
export function saveAiConfig(apiKey: string, model: string) {
  if (apiKey.trim()) sessionStorage.setItem(AI_KEY_STORAGE, apiKey.trim()); else sessionStorage.removeItem(AI_KEY_STORAGE);
  sessionStorage.setItem(AI_MODEL_STORAGE, model.trim() || 'gpt-5-mini');
}
export function clearAiConfig() { sessionStorage.removeItem(AI_KEY_STORAGE); sessionStorage.removeItem(AI_MODEL_STORAGE); }
export async function getAiStatus() { return apiFetch('/ai/status'); }
export async function saveAiConfigServer(apiKey: string, model: string, enabled = true) {
  const result = await apiFetch('/ai/config', { method: 'PUT', body: JSON.stringify({ apiKey: apiKey.trim() || undefined, model: model.trim() || 'gpt-5-mini', enabled }) });
  saveAiConfig('', model); return result;
}
export async function testAiConnection(apiKey?: string, model?: string) {
  const config = getAiConfig(); return apiFetch('/ai/test', { method: 'POST', body: JSON.stringify({ apiKey: apiKey?.trim() || config.apiKey || undefined, model: model?.trim() || config.model }) });
}
export async function clearAiConfigServer() { const result = await apiFetch('/ai/config', { method: 'DELETE' }); clearAiConfig(); return result; }
export async function askProfessor(message: string, project?: unknown, projectId?: string) { return apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ message, project, projectId }) }); }
export async function generateProjectWithAi(prompt: string, projectId?: string) { return apiFetch('/ai/generate-project', { method: 'POST', body: JSON.stringify({ prompt, projectId }) }); }
export function getCurrentProjectContext() {
  const project = localStorage.getItem('electrocad-project'); const plant = localStorage.getItem('electrocad-plant');
  return { project: project ? JSON.parse(project) : null, plant: plant ? JSON.parse(plant) : null };
}
