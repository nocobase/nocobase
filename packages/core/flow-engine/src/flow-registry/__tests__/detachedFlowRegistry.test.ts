/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { DetachedFlowRegistry, replaceFlowRegistry, serializeFlowRegistry } from '../DetachedFlowRegistry';

describe('DetachedFlowRegistry', () => {
  test('keeps flow edits detached and can replace another registry', () => {
    const source = {
      flow1: {
        title: 'Flow 1',
        steps: {
          step1: { title: 'Step 1' } as any,
        },
      },
    };
    const registry = new DetachedFlowRegistry(source);

    source.flow1.title = 'Changed outside';
    expect(registry.getFlow('flow1')?.title).toBe('Flow 1');

    const flow = registry.getFlow('flow1');
    expect(flow).toBeDefined();
    if (!flow) {
      throw new Error('flow1 should exist');
    }
    flow.title = 'Draft title';
    const serialized = serializeFlowRegistry(registry);
    serialized.flow1.title = 'Changed serialized';
    expect(registry.getFlow('flow1')?.title).toBe('Draft title');

    const target = new DetachedFlowRegistry({ stale: { title: 'Stale', steps: {} } });
    replaceFlowRegistry(target, serializeFlowRegistry(registry));

    expect(target.hasFlow('stale')).toBe(false);
    expect(target.getFlow('flow1')?.title).toBe('Draft title');

    target.destroyFlow('flow1');
    expect(target.hasFlow('flow1')).toBe(false);
  });
});
