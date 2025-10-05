/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock engine api provider
vi.mock('@nocobase/flow-engine', () => {
  const doc = {
    properties: { foo: 'foo prop' },
    methods: { bar: 'bar method' },
  };
  return {
    getRunJSDocFor: () => doc,
    FlowRunJSContext: { getDoc: () => doc },
    // New cohesive APIs
    listSnippetsForContext: async () => [
      {
        name: 'Class Snippet',
        prefix: 'sn-class',
        description: 'cls',
        body: 'alert(1)',
        ref: 'scene/jsblock/x',
        group: 'scene/jsblock',
      },
    ],
    setupRunJSContexts: () => void 0,
  };
});

import { buildRunJSCompletions } from '../runjsCompletions';

describe('buildRunJSCompletions', () => {
  it('builds ctx property/method completions and snippets', async () => {
    const hostCtx = {}; // not used since engine doc is mocked
    const { completions, entries } = await buildRunJSCompletions(hostCtx, 'v1');
    expect(Array.isArray(completions)).toBe(true);
    // property
    expect(completions.some((c: any) => c.label === 'ctx.foo')).toBe(true);
    // method (with parentheses)
    const method = completions.find((c: any) => c.label === 'ctx.bar()');
    expect(method).toBeTruthy();
    // method completion should provide an apply function to insert parentheses
    expect(typeof (method as any).apply).toBe('function');
    // snippet from class loader
    expect(completions.some((c: any) => c.label === 'sn-class')).toBe(true);
    // entries produced for drawer
    expect(entries.some((e) => e.name === 'Class Snippet')).toBe(true);
  });
});
