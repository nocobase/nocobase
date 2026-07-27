/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { resolveMapSettingsHref } from '../settingsLink';

const originalModernPrefix = window.__nocobase_modern_client_prefix__;

describe('resolveMapSettingsHref', () => {
  afterEach(() => {
    window.__nocobase_modern_client_prefix__ = originalModernPrefix;
  });

  it('opens the standalone Settings document for the main application', () => {
    window.__nocobase_modern_client_prefix__ = 'v';
    const app = {
      name: 'main',
      getPublicPath: () => '/nocobase/v/',
      pluginSettingsManager: { getRoutePath: () => '/admin/settings/map' },
    };

    expect(resolveMapSettingsHref(app, '/nocobase/v/admin/demo')).toBe('/nocobase/settings/map');
    expect(resolveMapSettingsHref(app, '/nocobase/v/admin/demo', '?tab=google')).toBe(
      '/nocobase/settings/map?tab=google',
    );
  });

  it.each(['apps', '_app'])('preserves the %s sub-application scope', (scope) => {
    window.__nocobase_modern_client_prefix__ = 'modern';
    const app = {
      name: 'demo',
      getPublicPath: () => '/base/modern/',
      pluginSettingsManager: { getRoutePath: () => '/admin/settings/map' },
    };

    expect(resolveMapSettingsHref(app, `/base/modern/${scope}/demo/admin/page`)).toBe(
      `/base/${scope}/demo/settings/map`,
    );
  });
});
