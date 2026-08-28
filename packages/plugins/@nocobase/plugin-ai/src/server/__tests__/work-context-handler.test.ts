/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';
import { createWorkContextHandler } from '../manager/work-context-handler';

describe('work context handler', () => {
  it('excludes internal fields from every context type before model resolution', async () => {
    const handler = createWorkContextHandler({} as never);
    handler.registerStrategy('custom-context', {
      resolve: async (_ctx, contextItem) => JSON.stringify(contextItem),
    });

    const frontendTools = [
      {
        id: 'context-1:update_record',
        blockUid: 'context-1',
        name: 'update_record',
        description: 'Update the current record.',
        permission: 'ASK',
        inputSchema: {
          type: 'object',
          properties: { value: { type: 'string' } },
        },
      },
    ];
    const resolved = await handler.resolve({} as Context, [
      {
        type: 'page-element',
        uid: 'context-1',
        content: { customer: 'Northwind' },
        frontendTools,
      },
      {
        type: 'flow-model',
        uid: 'context-2',
        content: { collection: 'orders' },
        frontendTools,
      },
      {
        type: 'custom-context',
        uid: 'context-3',
        content: { status: 'active' },
        frontendTools,
      },
    ]);

    expect(resolved).toHaveLength(3);
    for (const context of resolved) {
      expect(context).not.toContain('frontendTools');
      expect(context).not.toContain('permission');
      expect(context).not.toContain('inputSchema');
      expect(context).not.toContain('update_record');
    }
    expect(resolved[0]).toContain('Northwind');
    expect(resolved[1]).toContain('orders');
    expect(resolved[2]).toContain('active');
  });
});
