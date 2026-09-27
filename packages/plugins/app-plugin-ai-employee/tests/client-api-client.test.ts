import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import {
  getAIEmployee,
  listAIEmployees,
  listEnabledKnowledgeBases,
  updateAIEmployee,
  type AIEmployeeRecord,
} from '../client/ai-employee-service.ts';
import {
  listLLMProviders,
  listLLMServices,
  listProviderModels,
  updateLLMServiceEnabled,
} from '../client/llm-service-service.ts';

function createClient(): {
  readonly client: ApiClient;
  readonly request: ReturnType<typeof vi.fn<ApiClient['request']>>;
} {
  const request = vi.fn<ApiClient['request']>();
  const stream = vi.fn<ApiClient['stream']>();
  return { client: { request, stream } as ApiClient, request };
}

describe('AI Employee application client transport', () => {
  it('routes employee management through the plugin AI API mount', async () => {
    const { client, request } = createClient();
    request
      .mockResolvedValueOnce([{ username: 'atlas' }])
      .mockResolvedValueOnce({ username: 'atlas' })
      .mockResolvedValueOnce({ username: 'atlas', enabled: false });

    await listAIEmployees(client);
    await getAIEmployee(client, 'atlas/team');
    await updateAIEmployee(
      client,
      { username: 'atlas' },
      {
        enabled: false,
        about: null,
        modelSettings: {},
        skillSettings: { skills: [], tools: [] },
        enableKnowledgeBase: false,
        knowledgeBasePrompt: '',
        knowledgeBase: {},
      },
    );

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'ai/aiEmployees:list',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'ai/aiEmployees:get',
      method: 'GET',
      query: { key: 'atlas/team' },
    });
    expect(request).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        path: 'ai/aiEmployees:update',
        method: 'PUT',
        query: { key: 'atlas' },
        json: expect.any(Object),
      }),
    );
  });

  it('discovers enabled knowledge bases through the plugin AI API mount', async () => {
    const { client, request } = createClient();
    const controller = new AbortController();
    request.mockResolvedValueOnce({
      data: {
        data: [
          { key: 'test-kb', name: 'Test1', enabled: true },
          { key: 'disabled-kb', name: 'Disabled', enabled: false },
          { key: 'default-enabled' },
          { name: 'Missing key', enabled: true },
        ],
        meta: { count: 4 },
      },
    });

    await expect(
      listEnabledKnowledgeBases(client, controller.signal),
    ).resolves.toEqual([
      { key: 'test-kb', name: 'Test1', enabled: true },
      { key: 'default-enabled', name: 'default-enabled', enabled: true },
    ]);

    expect(request).toHaveBeenCalledWith({
      path: 'ai/aiKnowledgeBase:list',
      method: 'GET',
      query: { paginate: false, 'filter[enabled]': true },
      signal: controller.signal,
    });
  });
  it.each([
    { response: [] },
    { response: { data: { data: [], meta: { count: 0 } } } },
  ])(
    'returns an empty option list for an empty knowledge-base response',
    async ({ response }) => {
      const { client, request } = createClient();
      request.mockResolvedValueOnce(response);
      await expect(listEnabledKnowledgeBases(client)).resolves.toEqual([]);
    },
  );

  it('routes LLM settings through the plugin AI API mount', async () => {
    const { client, request } = createClient();
    request
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        name: 'deepseek',
        provider: 'deepseek',
        enabled: true,
        enabledModels: { mode: 'provider', models: [] },
      })
      .mockResolvedValueOnce([]);

    await listLLMServices(client);
    await listLLMProviders(client);
    await updateLLMServiceEnabled(client, 'deepseek/chat', true);
    await listProviderModels(client, 'deepseek', 'chat model');

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'ai/llmServices:list',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'ai/ai:listLLMProviders',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      path: 'ai/llmServices:updateEnabled',
      method: 'POST',
      json: { name: 'deepseek/chat', enabled: true },
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      path: 'ai/ai:listProviderModels',
      method: 'POST',
      json: { llmService: 'deepseek', search: 'chat model' },
    });
  });

  it('does not require Portal SDK response envelopes', async () => {
    const { client, request } = createClient();
    const employee: AIEmployeeRecord = { username: 'direct-json' };
    request.mockResolvedValueOnce(employee);

    await expect(getAIEmployee(client, 'direct-json')).resolves.toBe(employee);
  });
});
