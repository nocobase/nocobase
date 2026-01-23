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
import { prepareRunJsCode } from '../utils/runjsTemplateCompat';

describe('ctx.runjs preprocessTemplates default', () => {
  it('enables template preprocess by default', async () => {
    const engine = new FlowEngine();
    const ctx = engine.context as any;
    ctx.defineProperty('user', { value: { id: 123 } });

    const r1 = await ctx.runjs('return {{ctx.user.id}};');
    expect(r1.success).toBe(true);
    expect(r1.value).toBe(123);

    const r2 = await ctx.runjs('return "{{ctx.user.id}}";');
    expect(r2.success).toBe(true);
    expect(r2.value).toBe('123');
  });

  it('can disable template preprocess explicitly', async () => {
    const engine = new FlowEngine();
    const ctx = engine.context as any;
    ctx.defineProperty('user', { value: { id: 123 } });

    const r = await ctx.runjs('return "{{ctx.user.id}}";', undefined, { preprocessTemplates: false });
    expect(r.success).toBe(true);
    expect(r.value).toBe('{{ctx.user.id}}');
  });

  it('does not double-preprocess already prepared code', async () => {
    const engine = new FlowEngine();
    const ctx = engine.context as any;
    ctx.defineProperty('user', { value: { id: 123 } });

    const prepared = await prepareRunJsCode('return "{{ctx.user.id}}";', { preprocessTemplates: true });
    const r = await ctx.runjs(prepared);
    expect(r.success).toBe(true);
    expect(r.value).toBe('123');
  });
});
