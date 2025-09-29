/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import {
  RunJSContextRegistry,
  registerDefaultMappings,
  getRunJSDocFor,
  createJSRunnerWithVersion,
  FlowRunJSContext,
} from '../runjs-context';
import { JSRunner } from '../JSRunner';
import type { FlowContext } from '../flowContext';

describe('flowRunJSContext registry and doc', () => {
  it('registerDefaultMappings should register v1 mapping', () => {
    registerDefaultMappings();
    expect(RunJSContextRegistry['resolve']('v1' as any, '*')).toBeTruthy();
  });

  it('getRunJSDocFor should pick subclass by model class name', () => {
    const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
    const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
    expect(doc?.label).toMatch(/JSBlock RunJS/);
  });

  it('createJSRunnerWithVersion returns a JSRunner', async () => {
    const stubCtx: any = {
      model: { constructor: { name: 'JSFieldModel' } },
      createProxy() {
        return this;
      },
    };
    const runner = createJSRunnerWithVersion.call(stubCtx, { version: 'v1' });
    expect(runner).toBeInstanceOf(JSRunner);
    const result = await runner.run('return 1 + 1');
    expect(result?.success).toBe(true);
    expect(result?.value).toBe(2);
  });

  it('default globals (window/document) should be injected for field/block contexts', async () => {
    const stubCtx: any = {
      model: { constructor: { name: 'JSFieldModel' } },
      createProxy() {
        return this;
      },
    };
    const runner = createJSRunnerWithVersion.call(stubCtx, { version: 'v1' });
    const r = await runner.run('return typeof window !== "undefined" && typeof document !== "undefined"');
    expect(r.success && r.value).toBe(true);
  });

  // Linkage kind via __runjsKind removed; linkage scripts now run in the host model context.

  it('allowlist should restrict keys when configured', async () => {
    class TestRestrictCtx extends FlowRunJSContext {
      static allow = { keys: ['message'] };
    }
    RunJSContextRegistry.register('v1' as any, 'TestModel', TestRestrictCtx as any);
    const stub: any = {
      model: { constructor: { name: 'TestModel' } },
      message: { success: (_: string) => {} },
      t: (_k: string) => 'ok',
      createProxy() {
        return this;
      },
    } as FlowContext as any;
    const runner = createJSRunnerWithVersion.call(stub, { version: 'v1' });
    const r1 = await runner.run('return typeof ctx.message !== "undefined"');
    expect(r1.success && r1.value).toBe(true);
    const r2 = await runner.run('return typeof ctx.t !== "undefined"');
    expect(r2.success && r2.value).toBe(false);
  });
});
