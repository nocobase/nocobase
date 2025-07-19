/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { ContextPathProxy } from '../ContextPathProxy';
import { FlowRuntimeContext } from '../flowContext';

describe('FlowRuntimeContext', () => {
  let engine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    engine = new FlowEngine();
    model = engine.createModel({ use: 'FlowModel' });
  });

  it('should support nested property access in runtime mode', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1');
    ctx.defineProperty('steps', { value: { step1: { result: 42 } } });
    ctx.defineProperty('runId', { value: 'abc123' });

    expect(ctx.steps.step1.result).toBe(42);
    expect(ctx.runId).toBe('abc123');
    expect(ctx.steps.step2).toBeUndefined();
    expect(ctx.steps.step1.notExist).toBeUndefined();
    expect(ctx.notFound).toBeUndefined();
  });

  it('should return string template in settings mode', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1', 'settings');
    ctx.defineProperty('runId', { value: 'mock' });
    ctx.defineProperty('steps', { value: {} });
    expect(ctx.runId.toString()).toBe('{{ctx.runId}}');
    expect(`${ctx.runId}`).toBe('{{ctx.runId}}');
    expect(ctx.runId).instanceOf(ContextPathProxy);
    expect(ctx.notFound).toBeUndefined();
    expect(`${ctx.steps.step1.result}`).toBe('{{ctx.steps.step1.result}}');
  });

  it('should throw on exit()', () => {
    const ctx = new FlowRuntimeContext(model, 'flow1', 'runtime');
    expect(() => ctx.exit()).toThrow();
  });
});
