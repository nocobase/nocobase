import { describe, expect, it } from 'vitest';

import { createAppCookieScope } from '../src/support/index.js';

describe('application cookie scope', () => {
  it.each([
    ['', '%2F'],
    ['/', '%2F'],
    ['///', '%2F'],
    ['/crm/', '%2Fcrm'],
    [' team/crm/ ', '%2Fteam%2Fcrm'],
    ['/a(b)', '%2Fa%28b%29'],
  ])('encodes the normalized public path %s as %s', (input, expected) => {
    expect(createAppCookieScope(input)).toBe(expected);
  });

  it('distinguishes complete paths, case, punctuation, and literal percent escapes', () => {
    const paths = [
      '/',
      '/main',
      '/crm',
      '/CRM',
      '/team/crm',
      '/crm/child',
      '/a-b',
      '/a_b',
      '/a.b',
      '/a(b)',
      '/a%28b%29',
    ];
    const scopes = paths.map(createAppCookieScope);
    expect(new Set(scopes).size).toBe(paths.length);
    for (const scope of scopes) expect(scope).toMatch(/^[a-zA-Z0-9%_.~-]+$/u);
  });
});
