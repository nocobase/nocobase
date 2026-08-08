/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { applyUnifiedPatch } from '../unified-patch';

describe('applyUnifiedPatch', () => {
  it('applies standard unified diff hunks', () => {
    const source = ['const title = "Old";', 'ctx.render(title);'].join('\n');
    const patch = [
      '--- a/page.js',
      '+++ b/page.js',
      '@@ -1,2 +1,3 @@',
      '-const title = "Old";',
      '+const title = "New";',
      '+const subtitle = "Built by an agent";',
      ' ctx.render(title);',
    ].join('\n');

    expect(applyUnifiedPatch(source, patch)).toBe(
      ['const title = "New";', 'const subtitle = "Built by an agent";', 'ctx.render(title);'].join('\n'),
    );
  });

  it('rejects mismatched context', () => {
    expect(() => applyUnifiedPatch('one', '@@ -1 +1 @@\n-wrong\n+two')).toThrow('does not match');
  });
});
