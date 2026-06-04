/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginLicenseClientV2 from '../plugin';

describe('PluginLicenseClientV2', () => {
  it('should keep the settings page ACL aligned with the menu ACL', async () => {
    const app = createMockClient({
      plugins: [
        [
          PluginLicenseClientV2 as any,
          {
            name: 'license-settings',
            packageName: '@nocobase/plugin-license',
          },
        ],
      ],
    });

    await app.load();

    expect(app.pluginSettingsManager.get('license-settings')).toMatchObject({
      key: 'license-settings',
      title: 'License settings',
      aclSnippet: 'pm.license-settings',
    });
    expect(app.pluginSettingsManager.get('license-settings.index')).toMatchObject({
      menuKey: 'license-settings',
      pageKey: 'index',
      title: 'License settings',
      aclSnippet: 'pm.license-settings',
      componentLoader: expect.any(Function),
    });
  });
});
