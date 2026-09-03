/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ACLRolesCheckProvider,
  createMockClient,
  NocoBaseDesktopRouteType,
  type NocoBaseDesktopRoute,
  Plugin,
} from '@nocobase/client-v2';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { message } from 'antd';
import { vi } from 'vitest';
import { AdminSettingsLayoutModel as ClientV2AdminSettingsLayoutModel } from '../settings-center';
import { AdminSettingsLayoutModel as ClientV1AdminSettingsLayoutModel } from '../../../client/src/pm/AdminSettingsLayoutModel';
import { NocoBaseBuildInPlugin } from '../nocobase-buildin-plugin';
import { matchSettingsRoute, sortTopLevelSettings } from '../settings-center/utils';

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
    desktopRoutes?: NocoBaseDesktopRoute[];
  } = {},
) => {
  const {
    snippets = ['pm', 'pm.system-settings.system-settings'],
    pmList = [],
    systemSettings = {},
    desktopRoutes = [],
  } = options;

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
    data: desktopRoutes,
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
  it('should match nested layout paths under a registered settings page', () => {
    const settings = {
      '/admin/settings/public-forms': {
        name: 'public-forms.index',
        topLevelName: 'public-forms',
        path: '/admin/settings/public-forms',
      },
      '/admin/settings/public-forms/advanced': {
        name: 'public-forms.advanced',
        topLevelName: 'public-forms',
        path: '/admin/settings/public-forms/advanced',
      },
    } as any;

    expect(matchSettingsRoute(settings, '/admin/settings/public-forms/form-1')).toMatchObject({
      name: 'public-forms.index',
    });
    expect(matchSettingsRoute(settings, '/admin/settings/public-forms/advanced/form-1')).toMatchObject({
      name: 'public-forms.advanced',
    });
  });

  it('should sort system-settings with other top-level settings by normal ordering', () => {
    const settings = [{ name: 'system-settings' }, { name: 'api-keys' }, { name: 'backups' }] as any;

    expect(sortTopLevelSettings(settings).map((item) => item.name)).toEqual(['api-keys', 'backups', 'system-settings']);
  });

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

  it('should expose current language variable as enabled-language selector', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/system-settings'] },
    });
    mockAdminRuntime(app, {
      systemSettings: {
        enabledLanguages: ['en-US', 'zh-CN'],
      },
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', 'systemSettings:get']);

    await waitFor(() => {
      const localeNode = app.flowEngine.context.getPropertyMetaTree().find((node) => node.name === 'locale');
      expect(localeNode).toMatchObject({
        name: 'locale',
        title: '{{t("Current language")}}',
        interface: 'select',
        uiSchema: {
          enum: [
            { label: 'English', value: 'en-US' },
            { label: '简体中文', value: 'zh-CN' },
          ],
        },
      });
    });
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

    expect(await screen.findByText('Demo plugin')).toBeInTheDocument();
  });

  it('should redirect to the first accessible page when the role cannot access settings', async () => {
    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/system-settings'] },
    });
    mockAdminRuntime(app, {
      snippets: ['!pm', '!pm.system-settings.system-settings'],
      desktopRoutes: [
        {
          id: 1,
          schemaUid: 'first-accessible-page',
          title: 'First accessible page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
        {
          id: 2,
          schemaUid: 'second-accessible-page',
          title: 'Second accessible page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      ],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check', '/desktopRoutes:listAccessible']);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/admin/first-accessible-page');
    });
    expect(app.router.state.historyAction).toBe('REPLACE');
    expect(screen.queryByText('Current settings page is unavailable')).not.toBeInTheDocument();
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
    mockAdminRuntime(app, {
      snippets: ['!pm', '!pm.system-settings.system-settings'],
      desktopRoutes: [
        {
          id: 1,
          schemaUid: 'first-accessible-page',
          title: 'First accessible page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      ],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Current settings page is unavailable')).toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/admin/settings/unknown');
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
    mockAdminRuntime(app, {
      desktopRoutes: [
        {
          id: 1,
          schemaUid: 'first-accessible-page',
          title: 'First accessible page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      ],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Hidden settings page')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Hidden demo' })).not.toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/admin/settings/hidden-demo');
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
      desktopRoutes: [
        {
          id: 1,
          schemaUid: 'first-accessible-page',
          title: 'First accessible page',
          type: NocoBaseDesktopRouteType.flowPage,
        },
      ],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Current settings page is unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Secure settings page')).not.toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/admin/settings/secure-demo');
  });

  it('should redirect a denied settings tab to the first accessible tab', async () => {
    const renderDeniedTab = vi.fn(() => <div>Denied tab content</div>);

    class ProtectedSettingsTabsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'protected-tabs', title: 'Protected tabs' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'protected-tabs',
          key: 'a-second',
          title: 'Second accessible tab',
          aclSnippet: 'pm.protected-tabs.second',
          sort: 20,
          Component: () => <div>Second accessible tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'protected-tabs',
          key: 'z-first',
          title: 'First accessible tab',
          aclSnippet: 'pm.protected-tabs.first',
          sort: 10,
          Component: () => <div>First accessible tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'protected-tabs',
          key: 'denied',
          title: 'Denied tab',
          aclSnippet: 'pm.protected-tabs.denied',
          sort: 30,
          Component: renderDeniedTab,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, ProtectedSettingsTabsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/protected-tabs/denied'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', '!pm.protected-tabs.denied'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/admin/settings/protected-tabs/z-first');
    });
    expect(app.router.router.state.historyAction).toBe('REPLACE');
    expect(await screen.findByText('First accessible tab content')).toBeInTheDocument();
    expect(screen.queryByText('Denied tab content')).not.toBeInTheDocument();
    expect(renderDeniedTab).not.toHaveBeenCalled();

    await act(async () => {
      await app.router.router.navigate('/admin/settings/protected-tabs/a-second');
    });

    expect(await screen.findByText('Second accessible tab content')).toBeInTheDocument();
    expect(app.router.router.state.location.pathname).toBe('/admin/settings/protected-tabs/a-second');
  });

  it('should skip an accessible dynamic tab when its route params cannot be resolved', async () => {
    class DynamicSettingsTabsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'dynamic-tabs', title: 'Dynamic tabs' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'dynamic-tabs',
          key: ':name',
          title: 'Dynamic tab',
          aclSnippet: 'pm.dynamic-tabs.dynamic',
          sort: 1,
          Component: () => <div>Dynamic tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'dynamic-tabs',
          key: 'fallback',
          title: 'Static fallback tab',
          aclSnippet: 'pm.dynamic-tabs.fallback',
          sort: 2,
          Component: () => <div>Static fallback tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'dynamic-tabs',
          key: 'denied',
          title: 'Denied tab',
          aclSnippet: 'pm.dynamic-tabs.denied',
          sort: 3,
          Component: () => <div>Denied dynamic tab content</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, DynamicSettingsTabsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/dynamic-tabs/denied'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', '!pm.dynamic-tabs.denied'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/admin/settings/dynamic-tabs/fallback');
    });
    expect(await screen.findByText('Static fallback tab content')).toBeInTheDocument();
  });

  it('should preserve resolved route params when redirecting between dynamic tabs', async () => {
    class DynamicSiblingTabsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'dynamic-siblings', title: 'Dynamic sibling tabs' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'dynamic-siblings',
          key: ':name/channels',
          title: 'Dynamic channels tab',
          aclSnippet: 'pm.dynamic-siblings.channels',
          sort: 1,
          Component: () => <div>Dynamic channels tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'dynamic-siblings',
          key: ':name/logs',
          title: 'Dynamic logs tab',
          aclSnippet: 'pm.dynamic-siblings.logs',
          sort: 2,
          Component: () => <div>Dynamic logs tab content</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, DynamicSiblingTabsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/dynamic-siblings/email:primary/logs'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', '!pm.dynamic-siblings.logs'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/admin/settings/dynamic-siblings/email:primary/channels');
    });
    expect(await screen.findByText('Dynamic channels tab content')).toBeInTheDocument();
  });

  it('should resolve hyphenated route param names when redirecting between dynamic tabs', async () => {
    class HyphenatedParamTabsPlugin extends Plugin {
      async load() {
        this.pluginSettingsManager.addMenuItem({ key: 'hyphenated-params', title: 'Hyphenated param tabs' });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'hyphenated-params',
          key: ':data-source/channels',
          title: 'Hyphenated channels tab',
          aclSnippet: 'pm.hyphenated-params.channels',
          sort: 1,
          Component: () => <div>Hyphenated channels tab content</div>,
        });
        this.pluginSettingsManager.addPageTabItem({
          menuKey: 'hyphenated-params',
          key: ':data-source/logs',
          title: 'Hyphenated logs tab',
          aclSnippet: 'pm.hyphenated-params.logs',
          sort: 2,
          Component: () => <div>Hyphenated logs tab content</div>,
        });
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, HyphenatedParamTabsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/hyphenated-params/email/logs'] },
    });
    mockAdminRuntime(app, {
      snippets: ['pm', '!pm.hyphenated-params.logs'],
    });

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    await waitFor(() => {
      expect(app.router.router.state.location.pathname).toBe('/admin/settings/hyphenated-params/email/channels');
    });
    expect(await screen.findByText('Hyphenated channels tab content')).toBeInTheDocument();
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

  it('should allow the settings sidebar menu to scroll independently', async () => {
    class ManySettingsPlugin extends Plugin {
      async load() {
        for (let index = 0; index < 30; index += 1) {
          this.pluginSettingsManager.addMenuItem({
            key: `scroll-demo-${index}`,
            title: `Scroll demo ${index}`,
          });
          this.pluginSettingsManager.addPageTabItem({
            menuKey: `scroll-demo-${index}`,
            key: 'index',
            title: `Scroll demo ${index}`,
            Component: () => <div>{`Scroll demo page ${index}`}</div>,
          });
        }
      }
    }

    const app = createMockClient({
      plugins: [NocoBaseBuildInPlugin, TestAclPlugin, ManySettingsPlugin],
      router: { type: 'memory', initialEntries: ['/admin/settings/scroll-demo-29'] },
    });
    mockAdminRuntime(app);

    await renderApp(app);
    await waitForGetRequests(app, ['/auth:check', 'roles:check']);

    expect(await screen.findByText('Scroll demo page 29')).toBeInTheDocument();

    const sidebar = screen.getByRole('menuitem', { name: 'Scroll demo 29' }).closest('.ant-layout-sider');
    expect(sidebar).toHaveStyle({ overflowY: 'auto' });
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
