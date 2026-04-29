/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLRolesCheckProvider, createMockClient, Plugin } from '@nocobase/client-v2';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { message } from 'antd';
import { AdminSettingsLayoutModel as ClientV2AdminSettingsLayoutModel } from '../settings-center';
import { AdminSettingsLayoutModel as ClientV1AdminSettingsLayoutModel } from '../../../client/src/pm/AdminSettingsLayoutModel';
import { NocoBaseBuildInPlugin } from '../nocobase-buildin-plugin';

class TestAclPlugin extends Plugin {
  async load() {
    this.app.use(ACLRolesCheckProvider);
  }
}

type MockClientApplication = ReturnType<typeof createMockClient>;

const renderApp = async (app: MockClientApplication) => {
  const Root = app.getRootComponent();
  render(<Root />);
  return Root;
};

const waitForGetRequests = async (app: MockClientApplication, urls: string[]) => {
  await waitFor(
    () => {
      const history = app.apiMock.history.get.map((request) => request.url);
      expect(history).toEqual(expect.arrayContaining(urls));
    },
    { timeout: 3000 },
  );
};

const mockAdminRuntime = (
  app: MockClientApplication,
  options: {
    snippets?: string[];
    pmList?: any[];
    systemSettings?: Record<string, any>;
  } = {},
) => {
  const { snippets = ['pm', 'pm.system-settings.system-settings'], pmList = [], systemSettings = {} } = options;

  app.dataSourceManager.getCollection = ((name: string, collectionName: string) => {
    if (name === 'main' && collectionName === 'attachments') {
      return {
        getOption(optionName: string) {
          if (optionName === 'storage') {
            return 'local';
          }
          return null;
        },
      } as any;
    }

    return undefined;
  }) as any;

  app.apiMock.onGet('/auth:check').reply(200, {
    data: {
      id: 1,
      nickname: 'Super Admin',
    },
  });
  app.apiMock.onGet('app:getLang').reply(200, {
    data: {
      lang: 'en-US',
      resources: {
        client: {},
      },
      cron: {},
    },
  });
  app.apiMock.onGet('app:getInfo').reply(200, {
    data: {
      id: 'mock-app',
    },
  });
  app.apiMock.onGet('roles:check').reply(200, {
    data: {
      role: 'root',
      snippets,
    },
  });
  app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, {
    data: [],
  });
  app.apiMock.onGet('systemSettings:get').reply(200, {
    data: {
      id: 1,
      title: 'NocoBase',
      raw_title: 'NocoBase',
      enabledLanguages: ['en-US'],
      logo: null,
      ...systemSettings,
    },
  });
  app.apiMock.onGet('storages:getBasicInfo/local').reply(200, {
    data: {
      name: 'local',
      rules: {
        size: 1024 * 1024 * 2,
        mimetype: 'image/*',
      },
    },
  });
  app.apiMock.onPost('systemSettings:put').reply((config) => {
    const nextValues = JSON.parse(config.data as string);

    return [
      200,
      {
        data: {
          id: 1,
          title: nextValues.raw_title,
          raw_title: nextValues.raw_title,
          enabledLanguages: nextValues.enabledLanguages || ['en-US'],
          logo: nextValues.logo || null,
        },
      },
    ];
  });
  app.apiMock.onGet('pm:list').reply(200, {
    data: pmList,
  });
  app.apiMock.onGet('pm:listEnabledV2').reply(200, {
    data: [],
  });
  app.apiMock.onPost('attachments:create').reply(200, {
    data: {
      id: 1,
      title: 'logo',
      filename: 'logo.png',
      url: 'https://example.com/logo.png',
    },
  });
};

describe('settings center', () => {
  it('should redirect /admin/settings to system-settings by default', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings'] },
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'systemSettings:get']);

    expect(await screen.findByDisplayValue('NocoBase')).toBeInTheDocument();
  });

  it('should fallback to plugin-manager when system-settings is not allowed', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', '!pm.system-settings.system-settings'],
      pmList: [
        {
          name: 'demo-plugin',
          packageName: '@nocobase/demo-plugin',
          displayName: 'Demo plugin',
          enabled: true,
          builtIn: false,
          version: '0.1.0',
          isCompatible: true,
        },
      ],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'pm:list']);

    expect(await screen.findByText('demo-plugin')).toBeInTheDocument();
    expect(screen.getByText('@nocobase/demo-plugin')).toBeInTheDocument();
  });

  it('should hide plugin-manager menu item when pm snippet is missing', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/system-settings'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm.system-settings.system-settings'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'systemSettings:get']);

    expect(await screen.findByDisplayValue('NocoBase')).toBeInTheDocument();
    expect(screen.queryByText('Plugin manager')).not.toBeInTheDocument();
  });

  it('should show route empty state for unknown settings routes', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/unknown'] },
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Current settings page is unavailable')).toBeInTheDocument();
  });

  it('should allow direct access to hidden page without showing menu entry', async () => {
    class HiddenSettingsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'hidden-demo', title: 'Hidden demo' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'hidden-demo',
          key: 'index',
          title: 'Hidden demo',
          hidden: true,
          Component: () => <div>Hidden settings page</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, HiddenSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/hidden-demo'] },
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Hidden settings page')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Hidden demo' })).not.toBeInTheDocument();
  });

  it('should show route empty state when direct access page has no permission', async () => {
    class ProtectedSettingsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'secure-demo', title: 'Secure demo' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'secure-demo',
          key: 'index',
          title: 'Secure demo',
          aclSnippet: 'pm.secure-demo.index',
          Component: () => <div>Secure settings page</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, ProtectedSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/secure-demo'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', 'pm.system-settings.system-settings', '!pm.secure-demo.index'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Current settings page is unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Secure settings page')).not.toBeInTheDocument();
  });

  it('should keep menu visible when menu acl is denied but child page is visible', async () => {
    class MenuAclPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({
          key: 'menu-acl-demo',
          title: 'Menu ACL Demo',
          aclSnippet: 'pm.menu-acl-demo.menu',
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'menu-acl-demo',
          key: 'index',
          title: 'Menu ACL Demo',
          Component: () => <div>Menu ACL child page</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, MenuAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/menu-acl-demo'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', 'pm.system-settings.system-settings', '!pm.menu-acl-demo.menu'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Menu ACL child page')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Menu ACL Demo' })).toBeInTheDocument();
  });

  it('should save system settings through systemSettings:put', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/system-settings'] },
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'systemSettings:get']);

    const textarea = await screen.findByDisplayValue('NocoBase');
    fireEvent.change(textarea, { target: { value: 'NocoBase Next' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(app.apiMock.history.post.some((request) => request.url === 'systemSettings:put')).toBe(true);
    });
  });

  it('should block invalid logo uploads by storage rules', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/system-settings'] },
    });
    const messageErrorSpy = vi.spyOn(message, 'error').mockImplementation(() => {
      return undefined as any;
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'systemSettings:get', 'storages:getBasicInfo/local']);

    const uploadInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(uploadInput).not.toBeNull();
    if (!uploadInput) {
      throw new Error('Upload input not found');
    }

    const invalidFile = new File(['plain-text'], 'invalid.txt', { type: 'text/plain' });
    fireEvent.change(uploadInput, {
      target: {
        files: [invalidFile],
      },
    });

    await waitFor(() => {
      expect(messageErrorSpy).toHaveBeenCalledWith('File type is not allowed');
    });
    expect(app.apiMock.history.post.some((request) => request.url === 'attachments:create')).toBe(false);

    messageErrorSpy.mockRestore();
  });

  it('should let client-v1 settings model inherit client-v2 base model', () => {
    expect(Object.getPrototypeOf(ClientV1AdminSettingsLayoutModel.prototype)).toBe(
      ClientV2AdminSettingsLayoutModel.prototype,
    );
  });
});
