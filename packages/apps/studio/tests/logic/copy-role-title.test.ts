import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { copyRoleTitle } from '../../client/pages/config/members/roles-model.js';

describe.each([
  ['English', enUS['roles.copyOf'], 93, ' (copy)'],
  ['Chinese', zhCN['roles.copyOf'], 96, '（副本）'],
] as const)('copy role titles in %s', (_locale, template, budget, marker) => {
  const t = (_key: string, options?: Record<string, unknown>) =>
    template.replace('{{name}}', String(options?.name ?? ''));

  it.each([7, 93, 94, 96, 97, 100])('fits a %i-unit source title', (length) => {
    const title = 'x'.repeat(length);
    expect(copyRoleTitle(t, title)).toBe(
      'x'.repeat(Math.min(length, budget)) + marker,
    );
    expect(copyRoleTitle(t, title).length).toBeLessThanOrEqual(100);
  });

  it('keeps complete surrogate pairs on either side of the boundary', () => {
    expect(copyRoleTitle(t, 'x'.repeat(budget - 1) + '😀tail')).toBe(
      'x'.repeat(budget - 1) + marker,
    );
    expect(copyRoleTitle(t, 'x'.repeat(budget - 2) + '😀tail')).toBe(
      'x'.repeat(budget - 2) + '😀' + marker,
    );
  });

  it('preserves short names and returns a trimmed nonempty title', () => {
    expect(copyRoleTitle(t, 'QA role')).toBe('QA role' + marker);
    expect(copyRoleTitle(t, '   ')).toBe(marker.trim());
  });
});
