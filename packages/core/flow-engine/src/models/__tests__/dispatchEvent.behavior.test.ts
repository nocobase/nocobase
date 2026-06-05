/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test, expect } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';

describe('dispatchEvent behavior (defaults, parallel, errors)', () => {
  test('non-beforeRender defaults to sequential execution and respects getEventFlows order', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    // Static flow with higher sort
    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      sort: 10,
      steps: { s: { handler: async () => void calls.push('static') } as any },
    });

    const model = engine.createModel({ use: 'M' });

    // Instance flows
    model.registerFlow('I1', {
      on: { eventName: 'go' },
      sort: 0,
      steps: { i1: { handler: async () => void calls.push('inst1') } as any },
    });
    model.registerFlow('I2', {
      on: { eventName: 'go' },
      sort: 5,
      steps: { i2: { handler: async () => void calls.push('inst2') } as any },
    });

    // No options provided -> should default to sequential execution
    await model.dispatchEvent('go');

    // Expected order should match getEventFlows('go') order
    const expected = model.getEventFlows('go').map((f) => f.key);
    expect(calls).toEqual(expected.map((k) => (k === 'I1' ? 'inst1' : k === 'I2' ? 'inst2' : 'static')));
  });

  test('parallel mode (sequential=false) runs all and tolerates non-beforeRender errors', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];

    M.registerFlow({
      key: 'S',
      on: { eventName: 'go' },
      sort: 1,
      steps: { s: { handler: async () => 'static-ok' } as any },
    });

    const model = engine.createModel({ use: 'M' });

    model.registerFlow('I1', {
      on: { eventName: 'go' },
      sort: 0,
      steps: { i1: { handler: async () => (calls.push('inst1'), 'i1-ok') } as any },
    });
    model.registerFlow('I2', {
      on: { eventName: 'go' },
      sort: 2,
      steps: { i2: { handler: async () => (calls.push('inst2'), 'i2-ok') } as any },
    });
    model.registerFlow('ERR', {
      on: { eventName: 'go' },
      sort: 3,
      steps: {
        e: {
          handler: async () => {
            calls.push('err');
            throw new Error('boom');
          },
        } as any,
      },
    });

    const results = await model.dispatchEvent('go', undefined, { sequential: false });

    // All handlers ran; order is not guaranteed in parallel mode
    expect(new Set(calls)).toEqual(new Set(['inst1', 'inst2', 'err']));
    // The error flow returns undefined and is filtered out; others return stepResults objects
    // Expect one result object per successful flow with its step key
    expect(Array.isArray(results)).toBe(true);
    const keys = (results as any[]).flatMap((o) => Object.keys(o));
    expect(new Set(keys)).toEqual(new Set(['i1', 'i2', 's']));
    const byKey = Object.assign({}, ...(results as any[]));
    expect(byKey['i1']).toBe('i1-ok');
    expect(byKey['i2']).toBe('i2-ok');
    expect(byKey['s']).toBe('static-ok');
  });

  test('sequential non-beforeRender: stops subsequent flows on error', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];
    const model = engine.createModel({ use: 'M' });

    model.registerFlow('I1', {
      on: { eventName: 'go' },
      sort: 0,
      steps: { i1: { handler: async () => void calls.push('i1') } as any },
    });
    model.registerFlow('ERR', {
      on: { eventName: 'go' },
      sort: 1,
      steps: {
        e: {
          handler: async () => {
            throw new Error('X');
          },
        } as any,
      },
    });
    model.registerFlow('I2', {
      on: { eventName: 'go' },
      sort: 2,
      steps: { i2: { handler: async () => void calls.push('i2') } as any },
    });

    await model.dispatchEvent('go', undefined, { sequential: true }).catch(() => undefined);
    // 只应执行第一个 flow，后续被中止
    expect(calls).toEqual(['i1']);
  });

  test('beforeRender errors are thrown (sequential default)', async () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const calls: string[] = [];
    const model = engine.createModel({ use: 'M' });

    model.registerFlow('F1', {
      on: 'beforeRender',
      sort: 0,
      steps: {
        a: {
          handler: async () => {
            throw new Error('BR');
          },
        } as any,
      },
    });
    model.registerFlow('F2', {
      on: 'beforeRender',
      sort: 1,
      steps: { b: { handler: async () => void calls.push('b') } as any },
    });

    await expect(model.dispatchEvent('beforeRender', undefined, { useCache: false })).rejects.toThrow('BR');
    expect(calls).toEqual([]);
  });
});
