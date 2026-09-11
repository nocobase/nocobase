/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class {
    app: MockApplication;
    pluginSettingsManager: MockApplication['pluginSettingsManager'];

    constructor(_options: unknown, app: MockApplication) {
      this.app = app;
      this.pluginSettingsManager = app.pluginSettingsManager;
    }

    t(key: string) {
      return this.app.i18n.t(key);
    }
  },
}));

class MockAclPlugin {
  rolesManager = {
    add: vi.fn(),
  };
}

vi.mock('@nocobase/plugin-acl/client-v2', () => ({
  default: MockAclPlugin,
}));

interface MockApplication {
  i18n: {
    t: ReturnType<typeof vi.fn>;
  };
  pm: {
    get: ReturnType<typeof vi.fn>;
  };
  pluginSettingsManager: {
    has: ReturnType<typeof vi.fn>;
    addMenuItem: ReturnType<typeof vi.fn>;
    addPageTabItem: ReturnType<typeof vi.fn>;
    setPluginSettingsLink: ReturnType<typeof vi.fn>;
  };
}

function createApp(hasUsersPermissions = true, aclPlugin = new MockAclPlugin()): MockApplication {
  return {
    i18n: {
      t: vi.fn((key: string) => key),
    },
    pm: {
      get: vi.fn(() => aclPlugin),
    },
    pluginSettingsManager: {
      has: vi.fn(() => hasUsersPermissions),
      addMenuItem: vi.fn(),
      addPageTabItem: vi.fn(),
      setPluginSettingsLink: vi.fn(),
    },
  };
}

describe('PluginDepartmentsClientV2', () => {
  it('registers departments settings under an existing users-permissions menu', async () => {
    const { default: PluginDepartmentsClientV2 } = await import('../plugin');
    const aclPlugin = new MockAclPlugin();
    const app = createApp(true, aclPlugin);
    const plugin = new PluginDepartmentsClientV2({}, app as never);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).not.toHaveBeenCalled();
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'users-permissions',
      key: 'departments',
      title: 'Departments',
      icon: 'ApartmentOutlined',
      sort: 3,
      aclSnippet: 'pm.departments',
      componentLoader: expect.any(Function),
    });
    expect(app.pluginSettingsManager.setPluginSettingsLink).toHaveBeenCalledWith(
      'departments',
      'users-permissions.departments',
    );
    expect(aclPlugin.rolesManager.add).toHaveBeenCalledWith('departments', {
      title: 'Departments',
      sort: 20,
      componentLoader: expect.any(Function),
    });
  });

  it('creates the shared users-permissions menu when ACL has not registered it yet', async () => {
    const { default: PluginDepartmentsClientV2 } = await import('../plugin');
    const app = createApp(false);
    const plugin = new PluginDepartmentsClientV2({}, app as never);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'users-permissions',
      title: 'Users & Permissions',
      isPinned: true,
      sort: 200,
      icon: 'TeamOutlined',
    });
  });
});
