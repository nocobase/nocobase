import { describe, expect, it } from 'vitest';
import metadata from '../../package.json' with { type: 'json' };
import concurrencyPlugin, * as server from '../../server/index.js';
import { LocalConcurrentBackend } from '../../server/mutex/index.js';
import { concurrencyServiceToken } from '../../server/tokens.js';
import { defineConcurrencyConfig } from '../../config/index.js';

describe('public plugin entries', () => {
  it('pairs deliberate source and published entries without a library root', () => {
    expect(metadata.exports).toEqual({
      './server': { types: './server/index.ts', import: './server/index.ts' },
      './config': { types: './config/index.ts', import: './config/index.ts' },
      './package.json': './package.json',
    });
    expect(metadata.publishConfig.exports).toEqual({
      './server': {
        types: './dist/server/index.d.ts',
        import: './dist/server/index.js',
      },
      './config': {
        types: './dist/config/index.d.ts',
        import: './dist/config/index.js',
      },
      './package.json': './package.json',
    });
    expect(metadata).not.toHaveProperty('main');
    expect(metadata).not.toHaveProperty('types');
  });

  it('exports the original backend and Token without exposing registry internals', () => {
    expect(server.default).toBe(concurrencyPlugin);
    expect(server.LocalConcurrentBackend).toBe(LocalConcurrentBackend);
    expect(server.concurrencyServiceToken).toBe(concurrencyServiceToken);
    expect(server).not.toHaveProperty('LocalResourceRegistry');
    expect(server).not.toHaveProperty('ResourceState');
    expect(defineConcurrencyConfig).toBeTypeOf('function');
  });
});
