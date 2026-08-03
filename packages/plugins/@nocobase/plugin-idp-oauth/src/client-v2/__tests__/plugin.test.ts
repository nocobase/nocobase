/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginIdpOauthClientV2 from '../plugin';

describe('PluginIdpOauthClientV2', () => {
  it('registers the device page as a full-width Settings details route', async () => {
    const app = {
      router: {
        add: vi.fn(),
      },
      pluginSettingsManager: {
        getRouteName: vi.fn(() => 'settings.idpOAuth.device'),
        getRoutePath: vi.fn(() => '/settings/idpOAuth/device'),
      },
    };
    const plugin = new PluginIdpOauthClientV2({} as never, app as never);

    await plugin.load();

    expect(app.pluginSettingsManager.getRouteName).toHaveBeenCalledWith('idpOAuth.device');
    expect(app.pluginSettingsManager.getRoutePath).toHaveBeenCalledWith('idpOAuth.device');
    expect(app.router.add).toHaveBeenCalledWith('settingsDetails.idpOAuth.device', {
      path: '/settings/idpOAuth/device',
      componentLoader: expect.any(Function),
    });
    expect(app.router.add).toHaveBeenCalledWith('idp-oauth.device', {
      path: '/settings/idpOAuth/device',
      componentLoader: expect.any(Function),
      skipAuthCheck: true,
    });
    expect(app.router.add).toHaveBeenCalledWith('idp-oauth-legacy-device', {
      path: '/idpOAuth/device',
      componentLoader: expect.any(Function),
      skipAuthCheck: true,
    });
    expect(app.router.add).toHaveBeenCalledWith('idp-oauth-modern-legacy-device', {
      path: '/v/idpOAuth/device',
      componentLoader: expect.any(Function),
      skipAuthCheck: true,
    });
  });
});
