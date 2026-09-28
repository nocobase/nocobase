/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { ToolsRuntime } from '@nocobase/ai';
import { describe, expect, it, vi } from 'vitest';
import subAgentWebSearch from '../subAgentWebSearch';

function createContext(values: Record<string, unknown>) {
  const invoke = vi.fn().mockResolvedValue({ text: 'result' });
  const getLLMService = vi.fn().mockResolvedValue({ provider: { invoke } });
  const ctx = {
    action: { params: { values } },
    app: { pm: { get: () => ({ aiManager: { getLLMService } }) } },
  } as unknown as Context;
  return { ctx, getLLMService };
}

const runtime: ToolsRuntime = { toolCallId: 'call-1', writer: vi.fn() };

describe('subAgentWebSearch', () => {
  const model = { llmService: 'opencode', model: 'glm-5' };

  it('passes the conversation session to the LLM provider', async () => {
    const { ctx, getLLMService } = createContext({ model, sessionId: 'session-1' });

    await subAgentWebSearch.invoke(ctx, { query: ['iPhone 18'] }, runtime);

    expect(getLLMService).toHaveBeenCalledWith(
      { ...model, webSearch: true, reasoning: { mode: 'off' } },
      { sessionId: 'session-1' },
    );
  });

  it('falls back to a generated session when the request has none', async () => {
    const { ctx, getLLMService } = createContext({ model });

    await subAgentWebSearch.invoke(ctx, { query: ['iPhone 18'] }, runtime);

    expect(getLLMService.mock.calls[0][1]).toEqual({ sessionId: expect.stringMatching(/^web-search-/) });
  });
});
