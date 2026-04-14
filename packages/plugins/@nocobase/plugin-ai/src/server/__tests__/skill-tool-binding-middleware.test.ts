/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { skillToolBindingMiddleware } from '../ai-employees/middleware/skill-tools';

describe('skillToolBindingMiddleware', () => {
  it('should keep only tools allowed by loaded skills in model requests', async () => {
    const middleware = skillToolBindingMiddleware(
      {
        getActivatedSkillToolNames: vi.fn().mockResolvedValue(new Set(['getSkill', 'dataQuery', 'getCollectionNames'])),
      } as any,
      {
        baseToolNames: ['getSkill'],
      },
    );

    const handler = vi.fn(async (request) => request);
    const result = await middleware.wrapModelCall(
      {
        tools: [{ name: 'getSkill' }, { name: 'dataQuery' }, { name: 'getCollectionNames' }, { name: 'hiddenTool' }],
      } as any,
      handler,
    );

    expect(handler).toHaveBeenCalledOnce();
    expect(result.tools.map((tool) => tool.name)).toEqual(['getSkill', 'dataQuery', 'getCollectionNames']);
  });

  it('should preserve provider built-in tools without names', async () => {
    const middleware = skillToolBindingMiddleware(
      {
        getActivatedSkillToolNames: vi.fn().mockResolvedValue(new Set(['getSkill'])),
      } as any,
      {
        baseToolNames: ['getSkill'],
      },
    );

    const handler = vi.fn(async (request) => request);
    const webSearchTool = { type: 'web_search_preview' };
    const googleSearchTool = { googleSearch: {} };
    const result = await middleware.wrapModelCall(
      {
        tools: [{ name: 'getSkill' }, webSearchTool, googleSearchTool, { name: 'hiddenTool' }],
      } as any,
      handler,
    );

    expect(handler).toHaveBeenCalledOnce();
    expect(result.tools).toEqual([{ name: 'getSkill' }, webSearchTool, googleSearchTool]);
  });
});
