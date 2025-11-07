/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { compileRunJs } from '../../utils/jsxTransform';

describe('compileRunJs', () => {
  it('returns original code when no JSX is present', async () => {
    const src = `const a = 1; const b = a + 1;`;
    const out = await compileRunJs(src);
    expect(out).toBe(src);
  });

  it('transforms JSX when sucrase is available (skip if missing)', async () => {
    const src = `ctx.render(<div className="x">hi</div>);`;

    // Try to import sucrase to decide if this environment has it installed
    const hasSucrase = await import('sucrase').then(() => true).catch(() => false);

    const out = await compileRunJs(src);

    if (!hasSucrase) {
      // Environment without sucrase: current implementation falls back to original code
      expect(out).toBe(src);
      return;
    }

    // sucrase available: output should contain React.createElement mapping
    expect(out).not.toBe(src);
    expect(out).toMatch(/ctx\.React\.createElement/);
  });
});
