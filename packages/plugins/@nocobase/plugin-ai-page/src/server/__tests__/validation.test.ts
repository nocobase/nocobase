/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { validateAIPageCode } from '../validation';

describe('validateAIPageCode', () => {
  it('accepts async RunJS page code', () => {
    const result = validateAIPageCode('const rows = await ctx.api.resource("tasks").list();\nctx.render(rows);');
    expect(result.valid).toBe(true);
  });

  it('returns syntax errors and safety warnings', () => {
    const invalid = validateAIPageCode('const = ;');
    const warning = validateAIPageCode('eval("ctx.render(1)");');

    expect(invalid.valid).toBe(false);
    expect(invalid.diagnostics[0].code).toBe('syntax_error');
    expect(warning.valid).toBe(true);
    expect(warning.diagnostics.some((item) => item.code === 'avoid_eval')).toBe(true);
  });
});
