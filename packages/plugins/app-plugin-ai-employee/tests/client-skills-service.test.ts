import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { listAISkills, listAITools } from '../client/ai-employee-service.js';

const skills = [
  {
    name: 'analysis',
    description: 'Analyze data',
    introduction: { title: 'Data analysis', about: 'An analyst skill' },
    scope: 'GENERAL',
    from: 'loader',
    tools: ['query-data', 'unknown-tool', 123],
  },
  { name: 'writing', description: 'Write documents' },
];

describe('Skills metadata API', () => {
  it.each([listAISkills, listAITools])(
    'preserves only top-level namespace metadata without translating or mutating responses',
    async (list) => {
      const rows = [
        {
          name: 'localized',
          title: 'English source',
          i18n: { namespace: '@test/owner' },
        },
        {
          name: 'literal',
          title: 'English source',
          introduction: { i18n: { namespace: '@test/nested' } },
        },
        { name: 'invalid', i18n: { namespace: 42 } },
      ];
      const original = structuredClone(rows);
      const api = {
        request: vi.fn().mockResolvedValue(rows),
      } as unknown as ApiClient;
      const result = await list(api);
      expect(result[0]).toMatchObject({
        title: 'English source',
        i18n: { namespace: '@test/owner' },
      });
      expect(result[1].i18n).toBeUndefined();
      expect(result[2].i18n).toBeUndefined();
      expect(rows).toEqual(original);
    },
  );

  it('normalizes tool introduction titles without dropping scope, source or registered permission', async () => {
    const api = {
      request: vi.fn().mockResolvedValue([
        {
          definition: {
            name: 'search',
            title: 'Fallback',
            description: 'Search records',
          },
          introduction: { title: 'Record search' },
          scope: 'GENERAL',
          from: 'mcp',
          defaultPermission: 'ALLOW',
        },
        {
          definition: { name: 'workflow', title: 'Workflow' },
          scope: 'CUSTOM',
          from: 'workflow',
          defaultPermission: 'ASK',
        },
      ]),
    } as unknown as ApiClient;
    await expect(listAITools(api)).resolves.toMatchObject([
      {
        name: 'search',
        title: 'Record search',
        description: 'Search records',
        scope: 'GENERAL',
        from: 'mcp',
        defaultPermission: 'ALLOW',
      },
      {
        name: 'workflow',
        title: 'Workflow',
        scope: 'CUSTOM',
        from: 'workflow',
        defaultPermission: 'ASK',
      },
    ]);
  });

  it('distinguishes tool catalog failures from empty results', async () => {
    const error = new Error('Unavailable');
    const api = {
      request: vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce([]),
    } as unknown as ApiClient;
    await expect(listAITools(api)).rejects.toBe(error);
    await expect(listAITools(api)).resolves.toEqual([]);
  });

  it.each([skills, { data: skills }, { data: { rows: skills } }])(
    'reads all skill metadata using the existing list endpoint: %j',
    async (response) => {
      const request = vi.fn().mockResolvedValue(response);
      const api = { request } as unknown as ApiClient;
      const signal = new AbortController().signal;
      const result = await listAISkills(api, signal);
      expect(request).toHaveBeenCalledExactlyOnceWith({
        path: 'ai/aiSkills:list',
        method: 'GET',
        signal,
      });
      expect(result).toMatchObject([
        {
          name: 'analysis',
          title: 'Data analysis',
          description: 'Analyze data',
          about: 'An analyst skill',
          scope: 'GENERAL',
          from: 'loader',
          tools: ['query-data', 'unknown-tool'],
        },
        { name: 'writing', description: 'Write documents' },
      ]);
      expect(result[1].title).toBeUndefined();
      expect(result[1].about).toBeUndefined();
    },
  );

  it('reads management titles and prefers introduction titles when both exist', async () => {
    const api = {
      request: vi.fn().mockResolvedValue([
        {
          name: 'managed',
          title: 'Managed title',
          description: 'Managed description',
        },
        {
          name: 'loaded',
          title: 'Fallback',
          introduction: { title: 'Introduction title' },
        },
      ]),
    } as unknown as ApiClient;
    await expect(listAISkills(api)).resolves.toMatchObject([
      {
        name: 'managed',
        title: 'Managed title',
        description: 'Managed description',
      },
      { name: 'loaded', title: 'Introduction title' },
    ]);
  });

  it('distinguishes request failures from an empty skill catalog', async () => {
    const error = new Error('Unavailable');
    const request = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([]);
    const api = { request } as unknown as ApiClient;
    await expect(listAISkills(api)).rejects.toBe(error);
    await expect(listAISkills(api)).resolves.toEqual([]);
  });

  it('propagates cancellation for both skill and tool metadata', async () => {
    const error = new DOMException('Aborted', 'AbortError');
    const api = {
      request: vi.fn().mockRejectedValue(error),
    } as unknown as ApiClient;
    const controller = new AbortController();
    controller.abort();
    await expect(listAISkills(api, controller.signal)).rejects.toBe(error);
    await expect(listAITools(api, controller.signal)).rejects.toBe(error);
  });
});
