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

  it('does not expose the knowledge-base tool when the current user has no accessible knowledge base', async () => {
    const employee = Object.create(AIEmployee.prototype) as AIEmployee;
    const hasAccessibleKnowledgeBase = vi.fn().mockResolvedValue(false);
    const getTools = vi.fn();

    Reflect.set(employee, 'employee', {
      toJSON: () => ({ enableKnowledgeBase: true, knowledgeBase: { knowledgeBaseKeys: ['handbook'] } }),
    });
    Reflect.set(employee, 'ctx', { state: { currentUser: { roles: [{ name: 'member' }] } } });
    Reflect.set(employee, 'plugin', {
      knowledgeBaseManager: {
        isEnabledKnowledgeBase: vi.fn().mockResolvedValue(true),
        hasAccessibleKnowledgeBase,
      },
    });
    Reflect.set(employee, 'toolsManager', { getTools });

    await expect(
      (employee as unknown as { getKnowledgeBaseRetrieveTool: () => Promise<unknown> }).getKnowledgeBaseRetrieveTool(),
    ).resolves.toBeUndefined();
    expect(hasAccessibleKnowledgeBase).toHaveBeenCalledWith({
      employee: { enableKnowledgeBase: true, knowledgeBase: { knowledgeBaseKeys: ['handbook'] } },
      roleNames: ['member'],
    });
    expect(getTools).not.toHaveBeenCalled();
  });
});
