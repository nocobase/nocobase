/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { RunJSContextRegistry, getRunJSDocFor, createJSRunnerWithVersion } from '..';
import { setupRunJSContexts } from '../runjs-context/setup';
import { FlowContext } from '../flowContext';
import { JSRunner } from '../JSRunner';

describe('flowRunJSContext registry and doc', () => {
  it('setupRunJSContexts should register v1 mapping', async () => {
    await setupRunJSContexts();
    expect(RunJSContextRegistry['resolve']('v1' as any, '*')).toBeTruthy();
  });

  it('getRunJSDocFor should pick subclass by model class name', async () => {
    await setupRunJSContexts();
    const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
    const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
    expect(doc?.label).toMatch(/JSBlock RunJS/);
  });

  it('createJSRunnerWithVersion returns a JSRunner', async () => {
    await setupRunJSContexts();
    const ctx = new FlowContext();
    ctx.defineProperty('model', {
      value: { constructor: { name: 'JSFieldModel' } },
    });
    ctx.defineMethod('createProxy', function () {
      return this;
    });
    const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
    expect(runner).toBeInstanceOf(JSRunner);
    const result = await runner.run('return 1 + 1');
    expect(result?.success).toBe(true);
    expect(result?.value).toBe(2);
  });

  it('default globals (window/document) should be injected for field/block contexts', async () => {
    await setupRunJSContexts();
    const ctx = new FlowContext();
    ctx.defineProperty('model', {
      value: { constructor: { name: 'JSFieldModel' } },
    });
    ctx.defineMethod('createProxy', function () {
      return this;
    });
    const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
    const r = await runner.run('return typeof window !== "undefined" && typeof document !== "undefined"');
    expect(r.success && r.value).toBe(true);
  });
});
