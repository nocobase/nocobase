/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AutoInjectPublicPathPlugin } from '../../../../build/src/injectPublicPathPlugin';

describe('AutoInjectPublicPathPlugin', () => {
  it('should inject dist/client-v2 publicPath entries for v2 plugin bundles', () => {
    const compiler: any = {
      options: {
        entry: './src/client-v2/index.ts',
      },
      hooks: {
        environment: {
          tap: vi.fn((_, callback) => callback()),
        },
      },
    };

    new AutoInjectPublicPathPlugin('@nocobase/plugin-acl', 'client-v2').apply(compiler);

    expect(Array.isArray(compiler.options.entry)).toBe(true);
    const dataUri = compiler.options.entry[0];
    expect(decodeURIComponent(dataUri)).toContain(
      'static/plugins/@nocobase/plugin-acl/dist/client-v2/',
    );
  });
});
