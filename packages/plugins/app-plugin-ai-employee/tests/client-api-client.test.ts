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
  updateLLMServiceEnabledModels,
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
  it('routes employee management through /api/aiEmployees, encoding the username', async () => {
    const { client, request } = createClient();
    request
      .mockResolvedValueOnce({ data: [{ username: 'atlas' }] })
      .mockResolvedValueOnce({ data: { username: 'atlas/team' } })
      .mockResolvedValueOnce({ data: { username: 'atlas', enabled: false } });

    await listAIEmployees(client);
    await expect(getAIEmployee(client, 'atlas/team')).resolves.toEqual({
      username: 'atlas/team',
    });
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
      path: 'aiEmployees',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'aiEmployees/atlas%2Fteam',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        path: 'aiEmployees/atlas',
        method: 'PATCH',
        json: expect.any(Object),
      }),
    );
  });

  it('routes LLM settings through /api/aiEmployee', async () => {
    const { client, request } = createClient();
    const service = {
      name: 'deepseek',
      provider: 'deepseek',
      enabled: true,
      enabledModels: { mode: 'provider', models: [] },
    };
    request
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: service })
      .mockResolvedValueOnce({ data: service })
      .mockResolvedValueOnce({ data: [{ id: 'chat-model' }] });

    await listLLMServices(client);
    await listLLMProviders(client);
    await updateLLMServiceEnabled(client, 'deepseek/chat', true);
    await updateLLMServiceEnabledModels(client, 'deepseek', {
      mode: 'custom',
      models: [{ label: 'Chat', value: 'chat' }],
    });
    await expect(
      listProviderModels(client, 'deepseek', 'chat model'),
    ).resolves.toEqual([{ label: 'chat-model', value: 'chat-model' }]);

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'aiEmployee/llmServices',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'aiEmployee/llmProviders',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      path: 'aiEmployee/llmServices/deepseek%2Fchat/enable',
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(4, {
      path: 'aiEmployee/llmServices/deepseek/enabledModels',
      method: 'PUT',
      json: { mode: 'custom', models: [{ label: 'Chat', value: 'chat' }] },
    });
    expect(request).toHaveBeenNthCalledWith(5, {
      path: 'aiEmployee/llmServices/deepseek/providerModels',
      method: 'GET',
      query: { q: 'chat model' },
    });
  });

  it('disables a service with its paired verb', async () => {
    const { client, request } = createClient();
    request.mockResolvedValueOnce({
      data: { name: 'deepseek', enabled: false },
    });

    await expect(
      updateLLMServiceEnabled(client, 'deepseek', false),
    ).resolves.toMatchObject({ name: 'deepseek', enabled: false });
    expect(request).toHaveBeenCalledWith({
      path: 'aiEmployee/llmServices/deepseek/disable',
      method: 'POST',
    });
  });

  it('reads enabled knowledge bases from the knowledge base plugin', async () => {
    const { client, request } = createClient();
    const controller = new AbortController();
    request.mockResolvedValueOnce({
      data: [
        { key: 'test-kb', name: 'Test1', enabled: true },
        { key: 'disabled-kb', name: 'Disabled', enabled: false },
        { key: 'missing-flag' },
        { key: 'string-flag', enabled: 'true' },
        { name: 'Missing key', enabled: true },
      ],
      meta: { page: 1, pageSize: 100, total: 5 },
    });

    // Only a real boolean `true` is enabled; a missing or non-boolean flag is not.
    await expect(
      listEnabledKnowledgeBases(client, controller.signal),
    ).resolves.toEqual([{ key: 'test-kb', name: 'Test1', enabled: true }]);
    expect(request).toHaveBeenCalledWith({
      path: 'aiKnowledgeBases',
      method: 'GET',
      query: { pageSize: 100 },
      signal: controller.signal,
    });
  });
});
