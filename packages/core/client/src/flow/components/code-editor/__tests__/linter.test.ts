/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { computeDiagnosticsFromText } from '../linter';

describe('code-editor linter', () => {
  it('ignores diagnostics on lines containing {{ ctx.* }} (template only line)', () => {
    const code = `{{ ctx.user.name }}`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.length).toBe(0);
  });

  it('ignores syntax errors on assignment line with {{ ctx.* }}', () => {
    const code = `const a = {{ctx.aaa.bb}}`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.length).toBe(0);
  });

  it('reports normal syntax errors when no template present', () => {
    const code = `const a = ;`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.length).toBeGreaterThan(0);
    // 至少应包含一个语法错误
    expect(diags.some((d) => d.severity === 'error' && /Syntax error:/.test(d.message))).toBe(true);
  });

  it('reports possible undefined variable warning', () => {
    const code = `foo + 1;`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('Possible undefined variable: foo'))).toBe(
      true,
    );
  });

  it('reports non-callable expression warning', () => {
    const code = `(1+2)()`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.some((d) => d.severity === 'warning' && d.message === 'This expression is not callable.')).toBe(true);
  });

  it('suppresses warnings on lines with template (non-callable + template)', () => {
    const code = `{{ ctx.x }}`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.length).toBe(0);
  });

  it('does not warn for allowed global ctx access', () => {
    const code = `ctx && ctx.viewer && ctx.view;`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.length).toBe(0);
  });

  it('warns for suspicious short ctx method call', () => {
    const code = `ctx.fw();`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('ctx.fw'))).toBe(true);
  });

  it('warns for unknown ctx method call when known ctx roots are provided', () => {
    const code = `ctx.foobar();`;
    const diags = computeDiagnosticsFromText(code, { knownCtxMemberRoots: ['t', 'setValue', 'getValue'] });
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('ctx.foobar'))).toBe(true);
  });

  it('warns for unknown ctx member access when known ctx roots are provided', () => {
    const code = `const x = ctx.foobar;`;
    const diags = computeDiagnosticsFromText(code, { knownCtxMemberRoots: ['t', 'setValue', 'getValue'] });
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('ctx.foobar'))).toBe(true);
  });

  it('does not warn for known ctx method call when known ctx roots are provided', () => {
    const code = `ctx.t("x"); ctx.setValue?.("y");`;
    const diags = computeDiagnosticsFromText(code, { knownCtxMemberRoots: ['t', 'setValue'] });
    expect(diags.some((d) => d.message.includes('Possible undefined ctx method call'))).toBe(false);
  });

  it('does not warn for known ctx member access when known ctx roots are provided', () => {
    const code = `const t = ctx.t; const setValue = ctx.setValue; const logger = ctx.logger;`;
    const diags = computeDiagnosticsFromText(code, { knownCtxMemberRoots: ['t', 'setValue'] });
    expect(diags.some((d) => d.message.includes('Possible unknown ctx member access'))).toBe(false);
  });

  it('still shows unknown ctx warnings even when syntax error exists', () => {
    const code = `ctx.foobar();\nconst a = ;\n(1+2)();\nconst x = ctx.bar;\n`;
    const diags = computeDiagnosticsFromText(code, { knownCtxMemberRoots: ['t', 'setValue'] });
    expect(diags.some((d) => d.severity === 'error' && /Syntax error:/.test(d.message))).toBe(true);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('ctx.foobar'))).toBe(true);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('ctx.bar'))).toBe(true);
    expect(diags.some((d) => d.severity === 'warning' && d.message === 'This expression is not callable.')).toBe(true);
  });

  it('does not warn for allowed global Blob', () => {
    const code = `const b = new Blob(['x']);\nb.size;`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('Possible undefined variable: Blob'))).toBe(
      false,
    );
  });
});
