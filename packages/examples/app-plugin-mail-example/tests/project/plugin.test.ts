import { describe, expect, it } from 'vitest';

import plugin from '../../server/index.js';

describe('@nocobase/app-plugin-mail-example', () => {
  it('declares its server plugin and provider contribution', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-mail-example',
      serviceProviders: [expect.any(Function)],
    });
  });
});
