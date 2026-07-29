/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginAclClientV2 from '../plugin';

describe('PluginAclClientV2', () => {
  it('should not register the legacy Desktop routes permission tab in Client V2', async () => {
    const app = createMockClient({ plugins: [PluginAclClientV2] });

    await app.load();

    const plugin = app.pm.get(PluginAclClientV2);
    const tabs = plugin.settingsUI.getPermissionsTabs({
      activeKey: 'general',
      activeRole: null,
      currentUserRole: null,
      onRoleChange: vi.fn(),
    });

    expect(tabs.map((tab) => tab.key)).toEqual(['general']);
    expect(tabs.map((tab) => tab.label)).not.toContain('Desktop routes');
  });
});
