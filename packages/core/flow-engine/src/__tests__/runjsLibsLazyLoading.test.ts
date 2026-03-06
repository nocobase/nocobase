/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { registerRunJSLib } from '../runjsLibs';

describe('RunJS ctx.libs lazy loading', () => {
  it('preloads member access via prepareRunJsCode injection', async () => {
    registerRunJSLib('testLib', async () => ({ foo: 123 }));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`return ctx.libs.testLib.foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(123);
  });

  it('preloads bracket access via prepareRunJsCode injection', async () => {
    registerRunJSLib('testLib', async () => ({ foo: 456 }));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`return ctx.libs['testLib'].foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(456);
  });

  it('preloads object destructuring via prepareRunJsCode injection', async () => {
    registerRunJSLib('testLib', async () => ({ foo: 789 }));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`const { testLib } = ctx.libs; return testLib.foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(789);
  });
});
