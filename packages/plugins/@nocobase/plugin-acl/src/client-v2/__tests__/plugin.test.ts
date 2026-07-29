/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const clientV2 = vi.hoisted(() => ({
  ACLRolesCheckProvider: Symbol('ACLRolesCheckProvider'),
}));

vi.mock('@nocobase/client-v2', () => ({
  ACLRolesCheckProvider: clientV2.ACLRolesCheckProvider,
  UIEditorTopbarActionModel: class UIEditorTopbarActionModel {},
  UserCenterSelectItemModel: class UserCenterSelectItemModel {},
  Plugin: class {
    app: MockApplication;
    pluginSettingsManager: MockApplication['pluginSettingsManager'];
    flowEngine: MockApplication['flowEngine'];

    constructor(_options: unknown, app: MockApplication) {
      this.app = app;
      this.pluginSettingsManager = app.pluginSettingsManager;
      this.flowEngine = app.flowEngine;
    }

    t(key: string) {
      return this.app.i18n.t(key);
    }
  },
}));

interface MockApplication {
  i18n: {
    t: ReturnType<typeof vi.fn>;
  };
  use: ReturnType<typeof vi.fn>;
  pluginSettingsManager: {
    addMenuItem: ReturnType<typeof vi.fn>;
    addPageTabItem: ReturnType<typeof vi.fn>;
    setPluginSettingsLink: ReturnType<typeof vi.fn>;
  };
  flowEngine: {
    registerModelLoaders: ReturnType<typeof vi.fn>;
  };
}

describe('PluginAclClientV2', () => {
  it('registers the ACL settings page, default permission tabs, and user-center model loader', async () => {
    const { default: PluginAclClientV2 } = await import('../plugin');
    const app: MockApplication = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      use: vi.fn(),
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
        setPluginSettingsLink: vi.fn(),
      },
      flowEngine: {
        registerModelLoaders: vi.fn(),
      },
    };
    const plugin = new PluginAclClientV2({}, app as never);

    await plugin.load();

    expect(app.use).toHaveBeenCalledWith(clientV2.ACLRolesCheckProvider);
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'users-permissions',
      title: 'Users & Permissions',
      isPinned: true,
      sort: 200,
      icon: 'TeamOutlined',
      showTabs: true,
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'users-permissions',
      key: 'roles',
      title: 'Roles & Permissions',
      icon: 'LockOutlined',
      aclSnippet: 'pm.acl.roles',
      sort: 4,
      componentLoader: expect.any(Function),
    });
    expect(app.pluginSettingsManager.setPluginSettingsLink).toHaveBeenCalledWith('acl', 'users-permissions.roles');

    const permissionTabs = plugin.settingsUI.getPermissionsTabs({
      activeKey: 'general',
      activeRole: { name: 'admin', title: 'Admin' },
      currentUserRole: { name: 'root', title: 'Root' },
      onRoleChange: vi.fn(),
    });
    expect(permissionTabs.map((item) => [item.key, item.label, item.sort])).toEqual([
      ['general', 'System', 10],
      ['menu', 'Desktop routes', 20],
    ]);

    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith({
      UIEditorTopbarActionModel: {
        loader: expect.any(Function),
      },
      SwitchRoleItemModel: {
        extends: 'UserCenterItemModel',
        loader: expect.any(Function),
      },
    });
    const modelLoaders = app.flowEngine.registerModelLoaders.mock.calls[0][0];
    await expect(modelLoaders.UIEditorTopbarActionModel.loader()).resolves.toHaveProperty(
      'name',
      'UIEditorTopbarActionModel',
    );
    await expect(modelLoaders.SwitchRoleItemModel.loader()).resolves.toHaveProperty('default');
  });
});
