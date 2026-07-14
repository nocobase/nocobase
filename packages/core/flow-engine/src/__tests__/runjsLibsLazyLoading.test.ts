/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, it, expect } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { registerRunJSLib } from '../runjsLibs';

describe('RunJS ctx.libs lazy loading', () => {
  const disposers: Array<() => void> = [];

  afterEach(() => {
    disposers.splice(0).forEach((dispose) => dispose());
  });

  it('preloads member access via prepareRunJsCode injection', async () => {
    disposers.push(registerRunJSLib('testLib', async () => ({ foo: 123 })));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`return ctx.libs.testLib.foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(123);
  });

  it('preloads bracket access via prepareRunJsCode injection', async () => {
    disposers.push(registerRunJSLib('testLib', async () => ({ foo: 456 })));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`return ctx.libs['testLib'].foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(456);
  });

  it('preloads object destructuring via prepareRunJsCode injection', async () => {
    disposers.push(registerRunJSLib('testLib', async () => ({ foo: 789 })));

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const r = await ctx.runjs(`const { testLib } = ctx.libs; return testLib.foo;`);
    expect(r.success).toBe(true);
    expect(r.value).toBe(789);
  });

  it('releases a plugin registration without affecting a newer provider', async () => {
    const disposeFirst = registerRunJSLib('fakeLib', async () => ({ answer: 42 }));
    const disposeSecond = registerRunJSLib('fakeLib', async () => ({ answer: 7 }));
    disposers.push(disposeSecond);
    disposeFirst();

    const engine = new FlowEngine();
    const ctx: any = engine.context;
    const result = await ctx.runjs('return ctx.libs.fakeLib.answer;');
    expect(result).toEqual(expect.objectContaining({ success: true, value: 7 }));

    disposeSecond();
    const nextEngine = new FlowEngine();
    const nextCtx: any = nextEngine.context;
    const missing = await nextCtx.runjs('return ctx.libs.fakeLib;');
    expect(missing).toEqual(expect.objectContaining({ success: true, value: undefined }));
  });
});
