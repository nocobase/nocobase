import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import { NocoBaseAIService } from '../registry/nocobase-ai/services/nocobase-ai-service.ts';

function createClient(): {
  readonly client: ApiClient;
  readonly request: ReturnType<typeof vi.fn<ApiClient['request']>>;
  readonly stream: ReturnType<typeof vi.fn<ApiClient['stream']>>;
} {
  const request = vi.fn<ApiClient['request']>();
  const stream = vi.fn<ApiClient['stream']>();
  return { client: { request, stream } as ApiClient, request, stream };
}

describe('NocoBaseAIService', () => {
  it('uses the App API client for resource actions', async () => {
    const { client, request } = createClient();
    request.mockResolvedValueOnce({
      data: [{ username: 'atlas', nickname: 'Atlas' }],
    });
    const service = new NocoBaseAIService(client);

    await expect(service.listEmployees()).resolves.toEqual([
      { username: 'atlas', nickname: 'Atlas' },
    ]);
    expect(request).toHaveBeenCalledWith({
      path: 'aiEmployees/roster',
      method: 'GET',
    });
  });

  it('serializes query values and JSON request bodies', async () => {
    const { client, request } = createClient();
    request
      .mockResolvedValueOnce({ data: [], meta: {} })
      .mockResolvedValueOnce({ data: { sessionId: 'session/1' } })
      .mockResolvedValueOnce(undefined);
    const service = new NocoBaseAIService(client);

    await service.listConversations('renewal risk');
    await service.updateConversationTitle('session/1', 'Weekly review');
    await service.destroyConversation('session/1');

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'aiEmployee/conversations',
      method: 'GET',
      query: { q: 'renewal risk' },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'aiEmployee/conversations/session%2F1',
      method: 'PATCH',
      json: { title: 'Weekly review' },
    });
    expect(request).toHaveBeenNthCalledWith(3, {
      path: 'aiEmployee/conversations/session%2F1',
      method: 'DELETE',
    });
  });

  it('reads history without marking it read, then marks it read in its own request', async () => {
    const { client, request } = createClient();
    request
      .mockResolvedValueOnce({ data: [], meta: {} })
      .mockResolvedValueOnce({ data: { sessionId: 'session-1', read: true } });
    const service = new NocoBaseAIService(client);

    await service.getConversationMessages('session-1', { updateRead: true });

    expect(request).toHaveBeenNthCalledWith(1, {
      path: 'aiEmployee/conversations/session-1/messages',
      method: 'GET',
      query: { pageSize: 200 },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: 'aiEmployee/conversations/session-1/markRead',
      method: 'POST',
    });
  });

  it('preserves FormData for uploads', async () => {
    const { client, request } = createClient();
    request.mockResolvedValueOnce({
      data: { id: 'file-1', filename: 'notes.txt' },
    });
    const service = new NocoBaseAIService(client);
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    await service.uploadFile(file);

    const options = request.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      path: 'aiEmployee/files',
      method: 'POST',
    });
    expect(options?.body).toBeInstanceOf(FormData);
  });

  it('uses the App API client streaming transport', async () => {
    const { client, stream } = createClient();
    const responseBody = new ReadableStream<Uint8Array>();
    stream.mockResolvedValueOnce(responseBody);
    const service = new NocoBaseAIService(client);

    await expect(
      service.sendMessagesStream({ sessionId: 'session-1', messages: [] }),
    ).resolves.toBe(responseBody);
    expect(stream).toHaveBeenCalledWith({
      path: 'aiEmployee/conversations/session-1/send',
      method: 'POST',
      json: { messages: [] },
    });
  });

  it('reports web search support for each enabled model', async () => {
    const { client, request } = createClient();
    request.mockResolvedValueOnce({
      data: [
        {
          llmService: 'deepseek',
          llmServiceTitle: 'DeepSeek',
          enabledModels: [
            { label: 'DeepSeek Flash', value: 'deepseek-flash' },
            { label: 'DeepSeek V4 Pro', value: 'deepseek-v4-pro' },
            { label: 'DeepSeek Chat', value: 'deepseek-chat' },
          ],
          supportWebSearch: true,
          webSearchModels: ['deepseek-flash', 'deepseek-v4-pro'],
        },
      ],
    });
    const service = new NocoBaseAIService(client);

    await expect(service.listModels()).resolves.toEqual([
      expect.objectContaining({
        value: 'deepseek-flash',
        supportWebSearch: true,
      }),
      expect.objectContaining({
        value: 'deepseek-v4-pro',
        supportWebSearch: true,
      }),
      expect.objectContaining({
        value: 'deepseek-chat',
        supportWebSearch: false,
      }),
    ]);
  });

  it('treats an empty web search model list as unrestricted', async () => {
    const { client, request } = createClient();
    request.mockResolvedValueOnce({
      data: [
        {
          llmService: 'openai',
          llmServiceTitle: 'OpenAI',
          enabledModels: [{ label: 'GPT-5', value: 'gpt-5' }],
          supportWebSearch: true,
          webSearchModels: [],
        },
      ],
    });
    const service = new NocoBaseAIService(client);

    await expect(service.listModels()).resolves.toEqual([
      expect.objectContaining({
        value: 'gpt-5',
        supportWebSearch: true,
      }),
    ]);
  });
});
