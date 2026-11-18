import { describe, expect, it } from 'vitest';
import { buildNpmrcFile } from '../src/lib/npmrc.ts';

describe('buildNpmrcFile', () => {
  it.each(['https://pkg-v3.nocobase.com/', 'https://registry.npmjs.org/'])(
    'persists the explicit scope override %s without changing the global registry',
    (nocobaseRegistry) => {
      const contents = buildNpmrcFile({ nocobaseRegistry });
      expect(contents).toContain(`@nocobase:registry=${nocobaseRegistry}`);
      expect(contents).not.toMatch(/^registry=/mu);
      expect(contents).toContain('strict-peer-dependencies=false');
      expect(contents).toMatch(/\n$/u);
    },
  );
  it('inherits package-manager registry settings when no override is supplied', () => {
    expect(buildNpmrcFile({})).toBe('strict-peer-dependencies=false\n');
  });
});
