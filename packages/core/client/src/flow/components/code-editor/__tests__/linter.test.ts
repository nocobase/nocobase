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

  it('does not warn for allowed global Blob', () => {
    const code = `const b = new Blob(['x']);\nb.size;`;
    const diags = computeDiagnosticsFromText(code);
    expect(diags.some((d) => d.severity === 'warning' && d.message.includes('Possible undefined variable: Blob'))).toBe(
      false,
    );
  });
});
