import { describe, expect, it } from 'vitest';

import serviceProviders from '../../client/providers/index.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('declares its Client ServiceProvider', () => {
    expect(serviceProviders).toHaveLength(1);
    expect(serviceProviders[0]).toBeTypeOf('function');
  });
});
