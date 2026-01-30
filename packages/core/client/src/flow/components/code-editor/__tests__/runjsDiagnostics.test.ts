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

describe('runjsDiagnostics', () => {
  it('returns multiple syntax issues in one pass (Lezer error recovery)', async () => {
    const code = `const a = ;\nconst b = ;\n`;
    const res = await diagnoseRunJS(code);
    const parseIssues = res.issues.filter((i) => i.type === 'lint' && i.ruleId === 'parse-error');
    expect(parseIssues.length).toBeGreaterThanOrEqual(2);
    expect(parseIssues.every((i) => typeof i.location?.start?.line === 'number')).toBe(true);
  });

  it('includes heuristic lint issues as issues (not warnings)', async () => {
    const code = `foo + 1;\n(1+2)();\n`;
    const res = await diagnoseRunJS(code);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'possible-undefined-variable')).toBe(true);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'no-noncallable-call')).toBe(true);
  });

  it('reports suspicious short ctx member call as a lint issue', async () => {
    const res = await diagnoseRunJS('ctx.fw();');
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'possible-undefined-ctx-member-call')).toBe(true);
  });

  it('attempts preview even when lint issues exist (collects runtime issue)', async () => {
    // Some environments may not throw on unresolved globals inside SES Compartment.
    // Ensure we always produce a runtime error while also having lint issues.
    const code = `console.log("preview-start");\nfoo;\nthrow new Error("boom");\n`;
    const res = await diagnoseRunJS(code);
    expect(res.issues.some((i) => i.type === 'lint')).toBe(true);
    expect(res.issues.some((i) => i.type === 'runtime')).toBe(true);
    expect(res.logs.some((l) => l.level === 'log' && l.message.includes('preview-start'))).toBe(true);
  });

  it('reports preview-start-failed when syntax prevents execution', async () => {
    const code = `const a = ;\n`;
    const res = await diagnoseRunJS(code);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'parse-error')).toBe(true);
    expect(res.issues.some((i) => i.type === 'runtime' && i.ruleId === 'preview-start-failed')).toBe(true);
  });

  it('reports non-callable call issues even when syntax errors exist', async () => {
    const code = `const a = ;\n(1+2)();\n`;
    const res = await diagnoseRunJS(code);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'parse-error')).toBe(true);
    expect(res.issues.some((i) => i.type === 'lint' && i.ruleId === 'no-noncallable-call')).toBe(true);
  });

  it('reports timeout as runtime issue and sets execution.timeout', async () => {
    vi.useFakeTimers();
    try {
      const p = diagnoseRunJS(`await new Promise(() => {});`);
      await vi.advanceTimersByTimeAsync(5000);
      const res = await p;
      expect(res.issues.some((i) => i.type === 'runtime' && i.ruleId === 'timeout')).toBe(true);
      expect(res.execution?.timeout).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('previewRunJS returns message with truncation note when exceeding length limit', async () => {
    const spam = `for (let i=0;i<120;i++){ console.error("X".repeat(120)); }\nthrow new Error("boom");`;
    const res = await previewRunJS(spam);
    expect(res.success).toBe(false);
    expect(res.message.length).toBeLessThanOrEqual(MAX_MESSAGE_CHARS);
    expect(/truncat(ed|ion)/i.test(res.message)).toBe(true);
    // Must preserve key runtime error information.
    expect(/boom/i.test(res.message)).toBe(true);
  });
});
