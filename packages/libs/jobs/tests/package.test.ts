import { describe, expect, it } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };

describe('@nocobase/jobs package', () => {
  it('publishes only the compiled output under a public scope', () => {
    expect(packageMetadata.files).toEqual(['dist']);
    expect(packageMetadata.publishConfig.access).toBe('public');
    expect(packageMetadata.engines.node).toBe('>=24.0.0');
  });

  it('loads its entry point', async () => {
    await expect(import('../src/index.js')).resolves.toBeTypeOf('object');
  });
});
