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
    properties: {
      foo: 'foo prop',
      api: {
        description: 'api client',
        completion: { insertText: 'ctx.api' },
        properties: {
          request: {
            description: 'send request',
            completion: { insertText: "await ctx.api.request({ url: '', method: 'get' })" },
          },
        },
      },
    },
    methods: {
      bar: {
        description: 'bar method',
        completion: { insertText: "ctx.bar('value')" },
      },
    },
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
        ref: 'scene/block/x',
        group: 'scene/block',
        groups: ['scene/block'],
        scenes: ['block'],
      },
    ],
    setupRunJSContexts: () => void 0,
  };
});

import { buildRunJSCompletions } from '../runjsCompletions';

describe('buildRunJSCompletions', () => {
  it('builds ctx property/method completions and snippets', async () => {
    const hostCtx = {}; // not used since engine doc is mocked
    const { completions, entries } = await buildRunJSCompletions(hostCtx, 'v1', 'block');
    expect(Array.isArray(completions)).toBe(true);
    // property
    expect(completions.some((c: any) => c.label === 'ctx.foo')).toBe(true);
    const apiProp = completions.find((c: any) => c.label === 'ctx.api');
    expect(apiProp).toBeTruthy();
    const apiReq = completions.find((c: any) => c.label === 'ctx.api.request');
    expect(apiReq).toBeTruthy();
    const mockView = { dispatch: vi.fn() } as any;
    (apiReq as any).apply?.(mockView, apiReq, 0, 0);
    expect(mockView.dispatch).toHaveBeenCalled();
    const inserted = mockView.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(inserted).toContain('ctx.api.request');
    // method (with parentheses)
    const method = completions.find((c: any) => c.label === 'ctx.bar()');
    expect(method).toBeTruthy();
    // method completion should provide an apply function to insert parentheses
    expect(typeof (method as any).apply).toBe('function');
    const mockViewMethod = { dispatch: vi.fn() } as any;
    (method as any).apply?.(mockViewMethod, method, 0, 0);
    expect(mockViewMethod.dispatch).toHaveBeenCalled();
    const methodInserted = mockViewMethod.dispatch.mock.calls[0][0]?.changes?.insert;
    expect(methodInserted).toContain('ctx.bar');
    // snippet from class loader
    expect(completions.some((c: any) => c.label === 'Class Snippet')).toBe(true);
    // entries produced for drawer
    expect(entries.some((e) => e.name === 'Class Snippet')).toBe(true);
  });

  it('filters snippets by scene when provided', async () => {
    const hostCtx = {};
    const { completions, entries } = await buildRunJSCompletions(hostCtx, 'v1', 'form');
    expect(entries.length).toBe(0);
    expect(completions.some((c: any) => c.label === 'Class Snippet')).toBe(false);
  });
});
