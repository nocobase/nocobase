import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { listAISkills, listAITools } from '../client/ai-employee-service.js';

const skills = [
  {
    name: 'analysis',
    title: 'Data analysis',
    description: 'Analyze data',
    about: 'An analyst skill',
    scope: 'GENERAL',
    source: 'loader',
    tools: [
      { name: 'query-data', title: 'Query data', available: true },
      { name: 'unknown-tool', title: 'unknown-tool', available: false },
    ],
  },
  {
    name: 'writing',
    title: 'writing',
    description: 'Write documents',
    about: '',
    scope: 'SPECIFIED',
    source: '',
    tools: [],
  },
];

describe('Skills metadata API', () => {
  it.each([listAISkills, listAITools])(
    'preserves only a string namespace without translating or mutating responses',
    async (list) => {
      const rows = [
        {
          name: 'localized',
          title: 'English source',
          i18n: { namespace: '@test/owner' },
        },
        { name: 'literal', title: 'English source' },
        { name: 'invalid', title: 'invalid', i18n: { namespace: 42 } },
      ];
      const original = structuredClone(rows);
      const api = {
        request: vi.fn().mockResolvedValue({ data: rows }),
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

  it('keeps tool titles, scope, source and registered permission', async () => {
    const api = {
      request: vi.fn().mockResolvedValue({
        data: [
          {
            name: 'search',
            title: 'Record search',
            description: 'Search records',
            about: '',
            scope: 'GENERAL',
            source: 'mcp',
            defaultPermission: 'ALLOW',
          },
          {
            name: 'workflow',
            title: 'workflow',
            description: '',
            about: '',
            scope: 'CUSTOM',
            source: 'workflow',
            defaultPermission: 'ASK',
          },
        ],
      }),
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
        scope: 'CUSTOM',
        from: 'workflow',
        defaultPermission: 'ASK',
      },
    ]);
  });

  it('distinguishes tool catalog failures from empty results', async () => {
    const error = new Error('Unavailable');
    const api = {
      request: vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: [] }),
    } as unknown as ApiClient;
    await expect(listAITools(api)).rejects.toBe(error);
    await expect(listAITools(api)).resolves.toEqual([]);
  });

  it('reads every skill from the skills collection with its tool names', async () => {
    const request = vi.fn().mockResolvedValue({ data: skills });
    const api = { request } as unknown as ApiClient;
    const signal = new AbortController().signal;
    const result = await listAISkills(api, signal);
    expect(request).toHaveBeenCalledExactlyOnceWith({
      path: 'aiEmployee/skills',
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
      { name: 'writing', title: 'writing', description: 'Write documents' },
    ]);
    expect(result[1].about).toBeUndefined();
  });

  it('distinguishes request failures from an empty skill catalog', async () => {
    const error = new Error('Unavailable');
    const request = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: [] });
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
