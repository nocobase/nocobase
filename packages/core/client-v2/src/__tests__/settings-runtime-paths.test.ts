/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { resolveStandaloneSettingsPath } from '../settings-app/runtimePaths';

const originalModernPrefix = window.__nocobase_modern_client_prefix__;

const createApp = (publicPath: string, basename: string, name = 'main') =>
  ({
    name,
    getPublicPath: () => publicPath,
    router: {
      getBasename: () => basename,
    },
  }) as any;

describe('standalone settings runtime paths', () => {
  afterEach(() => {
    window.__nocobase_modern_client_prefix__ = originalModernPrefix;
  });

  it('maps legacy v2 settings paths to the root-public standalone SPA', () => {
    const app = createApp('/nocobase/v/', '/nocobase/v');

    expect(resolveStandaloneSettingsPath(app, '/nocobase/v/admin/settings/system-settings?tab=mail#smtp')).toBe(
      '/nocobase/settings/system-settings?tab=mail#smtp',
    );
    expect(resolveStandaloneSettingsPath(app, '/nocobase/v/admin/workflow/workflows/42?tab=nodes#canvas')).toBe(
      '/nocobase/settings/workflow/workflows/42?tab=nodes#canvas',
    );
    expect(resolveStandaloneSettingsPath(app, '/nocobase/v/admin/workflow/executions/88')).toBe(
      '/nocobase/settings/workflow/executions/88',
    );
    expect(resolveStandaloneSettingsPath(app, '/nocobase/v/admin/settings/ai/knowledge-base/detail/k1/documents')).toBe(
      '/nocobase/settings/ai/knowledge-base/detail/k1/documents',
    );
  });

  it('preserves both supported sub-application scopes', () => {
    const appsApp = createApp('/nocobase/v/', '/nocobase/v/apps/demo');
    const newApp = createApp('/nocobase/v/', '/nocobase/v/_app/demo');

    expect(resolveStandaloneSettingsPath(appsApp, '/nocobase/v/apps/demo/admin/settings/routes')).toBe(
      '/nocobase/settings/apps/demo/routes',
    );
    expect(resolveStandaloneSettingsPath(newApp, '/nocobase/v/_app/demo/admin/settings/routes')).toBe(
      '/nocobase/settings/_app/demo/routes',
    );
  });

  it('supports a custom modern prefix without leaking it into settings URLs', () => {
    window.__nocobase_modern_client_prefix__ = 'modern';
    const app = createApp('/base/modern/', '/base/modern');

    expect(resolveStandaloneSettingsPath(app, '/base/modern/admin/settings/security')).toBe('/base/settings/security');
  });

  it('does not treat an apps segment inside the main application public path as a sub-application scope', () => {
    window.__nocobase_modern_client_prefix__ = 'modern';
    const app = createApp('/tenant/apps/root/modern/', '/tenant/apps/root/modern');

    expect(resolveStandaloneSettingsPath(app, '/tenant/apps/root/modern/admin/settings/security')).toBe(
      '/tenant/apps/root/settings/security',
    );
  });

  it.each(['apps', '_app'])(
    'does not remove a matching %s segment from the root public path for a real sub-application',
    (scope) => {
      window.__nocobase_modern_client_prefix__ = 'modern';
      const app = createApp(`/tenant/${scope}/demo/modern/`, `/tenant/${scope}/demo/modern/${scope}/demo`, 'demo');

      expect(
        resolveStandaloneSettingsPath(app, `/tenant/${scope}/demo/modern/${scope}/demo/admin/settings/security`),
      ).toBe(`/tenant/${scope}/demo/settings/${scope}/demo/security`);
      expect(
        resolveStandaloneSettingsPath(
          app,
          `/tenant/${scope}/demo/modern/${scope}/demo/admin/settings/mail/oauth2?code=abc#done`,
        ),
      ).toBe(`/tenant/${scope}/demo/${scope}/demo/admin/settings/mail/oauth2?code=abc#done`);
    },
  );

  it('returns the legacy V1 callback for Email OAuth', () => {
    const app = createApp('/nocobase/v/', '/nocobase/v/apps/demo');

    expect(resolveStandaloneSettingsPath(app, '/nocobase/v/apps/demo/admin/settings/mail/oauth2?code=abc#done')).toBe(
      '/nocobase/apps/demo/admin/settings/mail/oauth2?code=abc#done',
    );
  });
});
