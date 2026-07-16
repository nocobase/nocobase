/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIClient, ToolsEntry } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { AIConfigRepository, type LLMServiceItem } from '../AIConfigRepository';

type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;
type ResourceActions = Record<string, ResourceAction>;

function createAPIClient(resources: Record<string, ResourceActions>): Pick<APIClient, 'resource'> {
  const emptyResource: ResourceActions = {};
  return {
    resource: (name: string) => resources[name] ?? emptyResource,
  };
}

function deferred<T>() {
  let resolveDeferred: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return {
    promise,
    resolve(value: T) {
      if (!resolveDeferred) {
        throw new Error('Deferred promise resolver is not initialized.');
      }
      resolveDeferred(value);
    },
  };
}

describe('AIConfigRepository', () => {
  it('caches getLLMServices until refresh is called', async () => {
    const serviceA: LLMServiceItem = {
      llmService: 'openai',
      llmServiceTitle: 'OpenAI',
      enabledModels: [{ label: 'GPT-4o', value: 'gpt-4o' }],
    };
    const serviceB: LLMServiceItem = {
      llmService: 'dashscope',
      llmServiceTitle: 'DashScope',
      enabledModels: [{ label: 'Qwen', value: 'qwen-max' }],
    };
    const listAllEnabledModels = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [serviceA] } })
      .mockResolvedValueOnce({ data: { data: [serviceB] } });
    const repo = new AIConfigRepository(createAPIClient({ ai: { listAllEnabledModels } }));

    await expect(repo.getLLMServices()).resolves.toEqual([serviceA]);
    await expect(repo.getLLMServices()).resolves.toEqual([serviceA]);
    expect(listAllEnabledModels).toHaveBeenCalledTimes(1);

    await expect(repo.refreshLLMServices()).resolves.toEqual([serviceB]);
    expect(listAllEnabledModels).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent getAIEmployees requests', async () => {
    const employeesResponse = deferred<unknown>();
    const listByUser = vi.fn(() => employeesResponse.promise);
    const repo = new AIConfigRepository(createAPIClient({ aiEmployees: { listByUser } }));

    const first = repo.getAIEmployees();
    const second = repo.getAIEmployees();
    expect(listByUser).toHaveBeenCalledTimes(1);

    employeesResponse.resolve({
      data: {
        data: [
          { username: 'lin', nickname: 'Lin' },
          { username: 'kai', nickname: 'Kai' },
        ],
      },
    });

    await expect(first).resolves.toEqual([
      { username: 'lin', nickname: 'Lin' },
      { username: 'kai', nickname: 'Kai' },
    ]);
    await expect(second).resolves.toEqual([
      { username: 'lin', nickname: 'Lin' },
      { username: 'kai', nickname: 'Kai' },
    ]);
    expect(listByUser).toHaveBeenCalledTimes(1);
  });

  it('uses the injected toolsManager before the resource fallback', async () => {
    const tool: ToolsEntry = {
      scope: 'GENERAL',
      from: 'loader',
      definition: {
        name: 'suggestions',
        description: 'Generate suggestions',
      },
    };
    const listToolsFromApi = vi.fn().mockResolvedValue({ data: { data: [] } });
    const listTools = vi.fn().mockResolvedValue([tool]);
    const repo = new AIConfigRepository(createAPIClient({ aiTools: { list: listToolsFromApi } }), {
      toolsManager: { listTools },
    });

    await expect(repo.getAITools('session-1')).resolves.toEqual([tool]);
    expect(listTools).toHaveBeenCalledWith({ sessionId: 'session-1' });
    expect(listToolsFromApi).not.toHaveBeenCalled();
  });
});
