/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { AIEmployee } from '../ai-employees/ai-employee';

type InterruptAction = {
  order: number;
  allowedDecisions: string[];
  toolCall?: { id: string; name: string };
};

describe('AIEmployee interrupt actions', () => {
  it('preserves parallel tool calls that share the same tool name', () => {
    const employee = Object.create(AIEmployee.prototype) as unknown as {
      toInterruptActions: (interrupt: {
        actionRequests: Array<{ name: string; args: unknown; description: string }>;
        reviewConfigs: Array<{ actionName: string; allowedDecisions: string[] }>;
      }) => Map<string, InterruptAction>;
    };
    const describe = (toolCallId: string) =>
      JSON.stringify({
        sessionId: 'session-1',
        from: 'main-agent',
        username: 'nathan',
        toolCallId,
        toolCallName: 'loadFrontendTool',
      });

    const actions = employee.toInterruptActions({
      actionRequests: [
        { name: 'loadFrontendTool', args: {}, description: describe('call-1') },
        { name: 'loadFrontendTool', args: {}, description: describe('call-2') },
        { name: 'loadFrontendTool', args: {}, description: describe('call-3') },
      ],
      reviewConfigs: [
        { actionName: 'loadFrontendTool', allowedDecisions: ['approve'] },
        { actionName: 'loadFrontendTool', allowedDecisions: ['approve', 'reject'] },
        { actionName: 'loadFrontendTool', allowedDecisions: ['approve', 'edit'] },
      ],
    });

    expect(Array.from(actions.keys())).toEqual(['call-1', 'call-2', 'call-3']);
    expect(Array.from(actions.values())).toMatchObject([
      { order: 0, allowedDecisions: ['approve'], toolCall: { id: 'call-1' } },
      { order: 1, allowedDecisions: ['approve', 'reject'], toolCall: { id: 'call-2' } },
      { order: 2, allowedDecisions: ['approve', 'edit'], toolCall: { id: 'call-3' } },
    ]);
  });
});
