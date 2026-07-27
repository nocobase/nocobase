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
    ['/settings/workflow/workflows/1?tab=nodes', true],
    ['/apps/demo/settings', true],
    ['/apps/demo/settings/workflow/workflows/1', true],
    ['/_app/demo/settings/ai/knowledge-base/detail/k1', true],
    ['/nocobase/settings/assets/index.js', false],
    ['/admin/settings', false],
    ['/v/admin/settings', false],
    ['/apps/demo/admin/settings', false],
  ])('matches only standalone Settings paths: %s', (pathname, expected) => {
    expect(isSettingsDevPath(pathname, '/')).toBe(expected);
  });

  it.each([
    ['/nocobase/settings', true],
    ['/nocobase/settings/workflow/workflows/1', true],
    ['/nocobase/apps/demo/settings', true],
    ['/nocobase/_app/demo/settings/ai/knowledge-base/detail/k1', true],
    ['/settings', false],
    ['/nocobase/admin/settings', false],
  ])('honors APP_PUBLIC_PATH: %s', (pathname, expected) => {
    expect(isSettingsDevPath(pathname, '/nocobase/')).toBe(expected);
  });

  it('rewrites application-scoped documents to the Settings dev-server base', () => {
    expect(rewriteSettingsDevProxyPath('/apps/demo/settings/workflow/workflows/1?tab=nodes', '/')).toBe(
      '/settings/workflow/workflows/1?tab=nodes',
    );
    expect(rewriteSettingsDevProxyPath('/_app/demo/settings?from=admin', '/')).toBe('/settings?from=admin');
    expect(rewriteSettingsDevProxyPath('/nocobase/apps/demo/settings/a#hash', '/nocobase/')).toBe(
      '/nocobase/settings/a#hash',
    );
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
    expect(options.context?.('/nocobase/apps/demo/settings/workflow')).toBe(true);
    expect(options.context?.('/nocobase/_app/demo/settings/ai')).toBe(true);
    expect(options.context?.('/nocobase/admin/settings')).toBe(false);
    expect(options.pathRewrite?.('/nocobase/apps/demo/settings/workflow')).toBe('/nocobase/settings/workflow');
  });
});
