import { describe, expect, it } from 'vitest';

import plugin from '../../server/index.js';

describe('@nocobase/app-plugin-modules', () => {
  it('declares only its selected Server capabilities', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-modules',
      serviceProviders: expect.any(Array),
    });
  });
});
