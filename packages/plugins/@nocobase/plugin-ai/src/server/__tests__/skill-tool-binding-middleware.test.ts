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
  it('should append tools from dynamically loaded skills to model requests', async () => {
    const middleware = skillToolBindingMiddleware(
      {
        getActivatedSkillToolNames: vi.fn().mockResolvedValue(new Set(['getSkill', 'dataQuery', 'getCollectionNames'])),
      } as any,
      {
        baseToolNames: ['getSkill'],
        toolCatalog: [{ name: 'getSkill' }, { name: 'dataQuery' }, { name: 'getCollectionNames' }] as any,
      },
    );

    const handler = vi.fn(async (request) => request);
    const result = await middleware.wrapModelCall(
      {
        tools: [{ name: 'getSkill' }],
      } as any,
      handler,
    );

    expect(handler).toHaveBeenCalledOnce();
    expect(result.tools.map((tool) => tool.name)).toEqual(['getSkill', 'dataQuery', 'getCollectionNames']);
  });
});
