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
  const createInjectedScript = (packageName: string, clientDistDir = 'client') => {
    const compiler: any = {
      options: {
        entry: './src/client/index.ts',
      },
      hooks: {
        environment: {
          tap: vi.fn((_, callback) => callback()),
        },
      },
    };

    new AutoInjectPublicPathPlugin(packageName, clientDistDir).apply(compiler);

    expect(Array.isArray(compiler.options.entry)).toBe(true);
    const dataUri = compiler.options.entry[0];
    return decodeURIComponent(String(dataUri).replace('data:text/javascript,', ''));
  };

  it('should inject dist/client-v2 publicPath entries for v2 plugin bundles', () => {
    const script = createInjectedScript('@nocobase/plugin-acl', 'client-v2');
    expect(script).toContain('static/plugins/@nocobase/plugin-acl/dist/client-v2/');
  });

  it('should derive client-v2 plugin chunk publicPath from current script src', () => {
    const script = createInjectedScript('@nocobase/plugin-acl', 'client-v2');
    const run = new Function(
      'window',
      'document',
      `let __webpack_public_path__ = ''; ${script}; return __webpack_public_path__;`,
    );

    const result = run(
      {},
      {
        currentScript: {
          src: 'https://cdn.nocobase.com/2.1.0/static/plugins/@nocobase/plugin-acl/dist/client-v2/index.js?hash=12345678',
        },
      },
    );

    expect(result).toBe('https://cdn.nocobase.com/2.1.0/static/plugins/@nocobase/plugin-acl/dist/client-v2/');
  });

  it('should derive plugin chunk publicPath from current script src', () => {
    const script = createInjectedScript('@nocobase/plugin-auth');
    const run = new Function(
      'window',
      'document',
      `let __webpack_public_path__ = ''; ${script}; return __webpack_public_path__;`,
    );

    const result = run(
      {},
      {
        currentScript: {
          src: 'https://cdn.nocobase.com/2.1.0/static/plugins/@nocobase/plugin-auth/dist/client/index.js?hash=12345678',
        },
      },
    );

    expect(result).toBe('https://cdn.nocobase.com/2.1.0/static/plugins/@nocobase/plugin-auth/dist/client/');
  });

  it('should fall back to runtime asset base when current script is unavailable', () => {
    const script = createInjectedScript('@nocobase/plugin-auth');
    const run = new Function(
      'window',
      'document',
      `let __webpack_public_path__ = ''; ${script}; return __webpack_public_path__;`,
    );

    const result = run(
      {
        __webpack_public_path__: 'https://cdn.nocobase.com/2.1.0-alpha.13.20260327061223/',
      },
      {
        currentScript: null,
      },
    );

    expect(result).toBe(
      'https://cdn.nocobase.com/2.1.0-alpha.13.20260327061223/static/plugins/@nocobase/plugin-auth/dist/client/',
    );
  });
});
