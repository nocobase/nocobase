import { describe, expect, it } from 'vitest';

import { buildNpmrcFile } from '../src/lib/npmrc.ts';

describe('buildNpmrcFile', () => {
  it('records a private registry for the NocoBase scope only', () => {
    const contents = buildNpmrcFile({
      registry: 'https://registry.internal.example',
    });

    expect(contents).toContain(
      '@nocobase:registry=https://registry.internal.example',
    );
    expect(contents).not.toMatch(/^registry=/mu);
  });

  /** A pin to a mirror is worth nothing once the packages are on the public registry, and outlives its usefulness. */
  it('writes no registry line for the public npm', () => {
    const contents = buildNpmrcFile({
      registry: 'https://registry.npmjs.org/',
    });

    expect(contents).not.toContain('registry=');
  });

  /**
   * The templates carry this line in their own `.npmrc`, but npm strips that file from every tarball it builds, so
   * it never reaches a generated project.
   */
  it('always carries the peer dependency setting the templates cannot ship', () => {
    for (const registry of [
      'https://registry.internal.example',
      'https://registry.npmjs.org/',
    ]) {
      expect(buildNpmrcFile({ registry })).toContain(
        'strict-peer-dependencies=false',
      );
    }
  });

  it('treats an unparseable registry as private rather than dropping it', () => {
    expect(buildNpmrcFile({ registry: 'not a url' })).toContain(
      '@nocobase:registry=not a url',
    );
  });

  it('ends with a newline', () => {
    expect(
      buildNpmrcFile({ registry: 'https://registry.internal.example' }),
    ).toMatch(/\n$/u);
  });
});
