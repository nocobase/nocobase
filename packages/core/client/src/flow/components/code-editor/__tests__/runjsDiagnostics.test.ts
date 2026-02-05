/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { diagnoseRunJS, previewRunJS, MAX_MESSAGE_CHARS } from '../runjsDiagnostics';
import { FlowContext, JSRunner } from '@nocobase/flow-engine';

describe('runjsDiagnostics', () => {
  const createTestCtx = () => {
    const ctx = new FlowContext() as any;
    ctx.defineMethod('createJSRunner', async (options?: any) => {
      const globals = { ...(options?.globals || {}), ctx };
      return new JSRunner({ globals, timeoutMs: options?.timeoutMs });
    });
    return ctx;
  };

  it('returns multiple syntax issues in one pass (Lezer error recovery)', async () => {
    const ctx = createTestCtx();
    const code = `const a = ;\nconst b = ;\n`;
    const res = await diagnoseRunJS(code, ctx);
    const parseIssues = res.issues.filter((i) => i.type === 'lint' && i.ruleId === 'parse-error');
    expect(parseIssues.length).toBeGreaterThanOrEqual(2);
    expect(parseIssues.every((i) => typeof i.location?.start?.line === 'number')).toBe(true);
  });

  it('includes heuristic lint issues as issues (not warnings)', async () => {
    const ctx = createTestCtx();
    const code = `foo + 1;\n(1+2)();\n`;
    const res = await diagnoseRunJS(code, ctx);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'possible-undefined-variable')).toBe(true);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'no-noncallable-call')).toBe(true);
  });

  it('reports suspicious short ctx member call as a lint issue', async () => {
    const ctx = createTestCtx();
    const res = await diagnoseRunJS('ctx.fw();', ctx);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'possible-undefined-ctx-member-call')).toBe(true);
  });

  it('attempts preview even when lint issues exist (collects runtime issue)', async () => {
    const ctx = createTestCtx();
    // Some environments may not throw on unresolved globals inside SES Compartment.
    // Ensure we always produce a runtime error while also having lint issues.
    const code = `console.log("preview-start");\nfoo;\nthrow new Error("boom");\n`;
    const res = await diagnoseRunJS(code, ctx);
    expect(res.issues.some((i) => i.type === 'lint')).toBe(true);
    expect(res.issues.some((i) => i.type === 'runtime')).toBe(true);
    expect(res.logs.some((l) => l.level === 'log' && l.message.includes('preview-start'))).toBe(true);
  });

  it('reports preview-start-failed when syntax prevents execution', async () => {
    const ctx = createTestCtx();
    const code = `const a = ;\n`;
    const res = await diagnoseRunJS(code, ctx);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'parse-error')).toBe(true);
    expect(res.issues.some((i) => i.type === 'runtime' && i.ruleId === 'preview-start-failed')).toBe(true);
  });

  it('reports non-callable call issues even when syntax errors exist', async () => {
    const ctx = createTestCtx();
    const code = `const a = ;\n(1+2)();\n`;
    const res = await diagnoseRunJS(code, ctx);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'parse-error')).toBe(true);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'no-noncallable-call')).toBe(true);
  });

  it('reports timeout as runtime issue and sets execution.timeout', async () => {
    const ctx = createTestCtx();
    vi.useFakeTimers();
    try {
      const p = diagnoseRunJS(`await new Promise(() => {});`, ctx);
      await vi.advanceTimersByTimeAsync(5000);
      const res = await p;
      expect(res.issues.some((i) => i.type === 'runtime' && i.ruleId === 'timeout')).toBe(true);
      expect(res.execution?.timeout).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('previewRunJS returns message with truncation note when exceeding length limit', async () => {
    const ctx = createTestCtx();
    const spam = `for (let i=0;i<120;i++){ console.error("X".repeat(120)); }\nthrow new Error("boom");`;
    const res = await previewRunJS(spam, ctx);
    expect(res.success).toBe(false);
    expect(res.message.length).toBeLessThanOrEqual(MAX_MESSAGE_CHARS);
    expect(/truncat(ed|ion)/i.test(res.message)).toBe(true);
    // Must preserve key runtime error information.
    expect(/boom/i.test(res.message)).toBe(true);
  });

  it('previewRunJS can reuse provided ctx.getVar to avoid false positives', async () => {
    const code = `const user = await ctx.getVar('ctx.user.roles.users.nickname');\nctx.render(String(user[0]));\n`;
    const ctx = createTestCtx();
    ctx.defineMethod('getVar', async (key: string) =>
      key === 'ctx.user.roles.users.nickname' ? ['alice'] : undefined,
    );
    ctx.defineMethod('render', () => undefined);
    const res = await previewRunJS(code, ctx as any);
    expect(res.success).toBe(true);
  });
});
