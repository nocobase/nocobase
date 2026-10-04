import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import { createAIEmployeeClient } from '../client/ai-employee-client.js';

function createApi(response: unknown = { data: [] }): {
  api: ApiClient;
  request: ReturnType<typeof vi.fn>;
} {
  const request = vi.fn().mockResolvedValue(response);
  return { api: { request } as unknown as ApiClient, request };
}

describe('createAIEmployeeClient', () => {
  it('sends every action through the client it was bound to', async () => {
    const { api, request } = createApi();
    const ai = createAIEmployeeClient(api);
    const controller = new AbortController();

    await ai.listAIEmployees(controller.signal);
    await ai.listLLMServices();
    await ai.updateMCPServerEnabled('search', false);

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'aiEmployees',
      method: 'GET',
      signal: controller.signal,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'aiEmployee/llmServices',
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      path: 'aiEmployee/mcpServers/search/disable',
      method: 'POST',
    });
  });

  it('keeps clients bound to different ApiClients apart', async () => {
    const first = createApi();
    const second = createApi();

    await createAIEmployeeClient(first.api).listManagedTools();

    expect(first.request).toHaveBeenCalledOnce();
    expect(second.request).not.toHaveBeenCalled();
  });
});
