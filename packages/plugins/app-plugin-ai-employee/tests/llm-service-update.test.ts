import { AIManager, MemoryRepositoryFactory } from '@nocobase/ai-employee';
import { describe, expect, it } from 'vitest';

import { EnabledModelsInput } from '../server/route/schemas.js';
import { LLMService } from '../server/service/llm-service.js';

async function createService() {
  const ai = new AIManager({ repositories: new MemoryRepositoryFactory() });
  await ai.llmServiceManager.registerLLMService({
    name: 'openai',
    title: 'OpenAI',
    provider: 'openai',
    options: { apiKey: 'configured-key', baseURL: 'https://api.test' },
    enabledModels: { mode: 'custom', models: [{ label: 'A', value: 'a' }] },
    enabled: true,
    sort: 3,
  });
  return { ai, service: new LLMService({ ai }) };
}

describe('LLMService narrow updates', () => {
  it('switches a service off without touching anything else', async () => {
    const { ai, service } = await createService();
    const before = await ai.llmServiceManager.getLLMService('openai');

    await expect(
      service.setEnabled({ name: 'openai', enabled: false }),
    ).resolves.toMatchObject({ name: 'openai', enabled: false });
    expect(await ai.llmServiceManager.getLLMService('openai')).toEqual({
      ...before,
      enabled: false,
    });
  });

  it('replaces the model list without touching anything else', async () => {
    const { ai, service } = await createService();
    const before = await ai.llmServiceManager.getLLMService('openai');
    const enabledModels = {
      mode: 'provider' as const,
      models: [{ label: 'B', value: 'b' }],
    };

    await service.updateEnabledModels({ name: 'openai', enabledModels });
    expect(await ai.llmServiceManager.getLLMService('openai')).toEqual({
      ...before,
      enabledModels,
    });
  });

  it('never creates a service', async () => {
    const { ai, service } = await createService();

    await expect(
      service.setEnabled({ name: 'new', enabled: true }),
    ).rejects.toMatchObject({ status: 404, reason: 'LLM_SERVICE_NOT_FOUND' });
    await expect(
      service.updateEnabledModels({
        name: 'new',
        enabledModels: { mode: 'custom', models: [] },
      }),
    ).rejects.toMatchObject({ status: 404, reason: 'LLM_SERVICE_NOT_FOUND' });
    expect(await ai.llmServiceManager.getLLMService('new')).toBeUndefined();
  });

  it('accepts only a whole model list as the enabledModels body', () => {
    for (const input of [
      null,
      {},
      ['a'],
      { mode: 'other', models: [] },
      { mode: 'custom' },
      { mode: 'custom', models: [{ value: '' }] },
      { mode: 'custom', models: [], enabled: false },
    ]) {
      expect(
        EnabledModelsInput.safeParse(input).success,
        JSON.stringify(input),
      ).toBe(false);
    }
    expect(
      EnabledModelsInput.safeParse({
        mode: 'custom',
        models: [{ label: 'A', value: 'a' }],
      }).success,
    ).toBe(true);
  });
});
