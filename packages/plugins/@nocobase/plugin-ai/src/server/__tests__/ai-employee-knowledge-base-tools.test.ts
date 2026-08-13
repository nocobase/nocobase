/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employees/ai-employee';

describe('AIEmployee knowledge-base tools', () => {
  it('does not expose the knowledge-base tool when tools are disabled', async () => {
    const employee = Object.create(AIEmployee.prototype) as AIEmployee;
    const getAIEmployeeTools = vi.fn();
    const getToolsMap = vi.fn();

    Reflect.set(employee, 'areToolsEnabled', () => false);
    Reflect.set(employee, 'getAIEmployeeTools', getAIEmployeeTools);
    Reflect.set(employee, 'getToolsMap', getToolsMap);

    await expect((employee as unknown as { getAgentTools: () => Promise<unknown> }).getAgentTools()).resolves.toEqual({
      tools: [],
      baseToolNames: new Set(),
    });
    expect(getAIEmployeeTools).not.toHaveBeenCalled();
    expect(getToolsMap).not.toHaveBeenCalled();
  });
});
