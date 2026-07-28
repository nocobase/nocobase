/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createSettingsDevProxyOptions, isSettingsDevPath, rewriteSettingsDevProxyPath } from '../settingsDevProxy';

describe('settings dev proxy', () => {
  it.each([
    ['/settings', true],
    ['/settings/signin', true],
    ['/settings/signup', true],
    ['/settings/forgot-password', true],
    ['/settings/reset-password?resetToken=test-token', true],
    ['/settings/2fa?redirect=%2Fsettings%2Fworkflow', true],
    ['/settings/workflow/workflows/1?tab=nodes', true],
    ['/settings/apps/demo/settings/signin', true],
    ['/settings/apps/demo/settings', true],
    ['/settings/apps/demo/settings/workflow/workflows/1', true],
    ['/settings/_app/demo/settings/reset-password?resetToken=test-token', true],
    ['/settings/_app/demo/settings/ai/knowledge-base/detail/k1', true],
    ['/nocobase/settings/assets/index.js', false],
    ['/admin/settings', false],
    ['/v/admin/settings', false],
    ['/apps/demo/settings', false],
    ['/_app/demo/settings', false],
    ['/apps/demo/admin/settings', false],
  ])('matches only standalone Settings paths: %s', (pathname, expected) => {
    expect(isSettingsDevPath(pathname, '/')).toBe(expected);
  });

  it.each([
    ['/nocobase/settings', true],
    ['/nocobase/settings/signin', true],
    ['/nocobase/settings/2fa?redirect=%2Fnocobase%2Fsettings', true],
    ['/nocobase/settings/workflow/workflows/1', true],
    ['/nocobase/settings/apps/demo/settings/forgot-password', true],
    ['/nocobase/settings/apps/demo/settings', true],
    ['/nocobase/settings/_app/demo/settings/reset-password?resetToken=test-token', true],
    ['/nocobase/settings/_app/demo/settings/ai/knowledge-base/detail/k1', true],
    ['/settings', false],
    ['/nocobase/admin/settings', false],
    ['/nocobase/apps/demo/settings', false],
  ])('honors APP_PUBLIC_PATH: %s', (pathname, expected) => {
    expect(isSettingsDevPath(pathname, '/nocobase/')).toBe(expected);
  });

  it.each([
    ['/settings', '/', '/settings/'],
    ['/settings?from=admin', '/', '/settings/?from=admin'],
    ['/settings/apps/demo/settings', '/', '/settings/apps/demo/settings'],
    ['/settings/_app/demo/settings?from=admin', '/', '/settings/_app/demo/settings?from=admin'],
    ['/nocobase/settings', '/nocobase/', '/nocobase/settings/'],
    [
      '/nocobase/settings/apps/demo/settings?from=admin',
      '/nocobase/',
      '/nocobase/settings/apps/demo/settings?from=admin',
    ],
    ['/nocobase/settings/_app/demo/settings#portal', '/nocobase/', '/nocobase/settings/_app/demo/settings#portal'],
  ])('normalizes a Settings root to the dev-server base: %s', (pathname, publicPath, expected) => {
    expect(rewriteSettingsDevProxyPath(pathname, publicPath)).toBe(expected);
  });

  it('preserves application-scoped documents for the Settings dev server', () => {
    expect(rewriteSettingsDevProxyPath('/settings/apps/demo/settings/workflow/workflows/1?tab=nodes', '/')).toBe(
      '/settings/apps/demo/settings/workflow/workflows/1?tab=nodes',
    );
    expect(rewriteSettingsDevProxyPath('/nocobase/settings/apps/demo/settings/a#hash', '/nocobase/')).toBe(
      '/nocobase/settings/apps/demo/settings/a#hash',
    );
    expect(rewriteSettingsDevProxyPath('/settings/assets/index.js', '/')).toBe('/settings/assets/index.js');
    expect(rewriteSettingsDevProxyPath('/settings/__rspack_hmr', '/')).toBe('/settings/__rspack_hmr');
  });

  it('creates a websocket-capable proxy for the Settings port', () => {
    const options = createSettingsDevProxyOptions('/nocobase/', 13004);

    expect(options).toMatchObject({
      target: 'http://127.0.0.1:13004',
      changeOrigin: true,
      ws: true,
      xfwd: true,
    });
    expect(options.context?.('/nocobase/settings/__rspack_hmr')).toBe(true);
    expect(options.context?.('/nocobase/settings/signin')).toBe(true);
    expect(options.context?.('/nocobase/settings/apps/demo/settings/workflow')).toBe(true);
    expect(options.context?.('/nocobase/settings/apps/demo/settings/2fa')).toBe(true);
    expect(options.context?.('/nocobase/settings/_app/demo/settings/ai')).toBe(true);
    expect(options.context?.('/nocobase/apps/demo/settings/workflow')).toBe(false);
    expect(options.context?.('/nocobase/admin/settings')).toBe(false);
    expect(options.pathRewrite?.('/nocobase/settings/apps/demo/settings/workflow')).toBe(
      '/nocobase/settings/apps/demo/settings/workflow',
    );
  });
});
