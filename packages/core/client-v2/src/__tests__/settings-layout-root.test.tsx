/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACLRolesCheckProvider, useRoleRecheck } from '../acl';
import { Plugin } from '../Plugin';
import { SettingsApplication } from '../settings-app/SettingsApplication';
import { SettingsBuildInPlugin } from '../settings-app/SettingsBuildInPlugin';

class TestAclPlugin extends Plugin {
  async load() {
    this.app.use(ACLRolesCheckProvider);
  }
}

class StandaloneSettingsPlugin extends Plugin {
  async load() {
    this.pluginSettingsManager.addMenuItem({ key: 'standalone', title: 'Standalone' });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'standalone',
      key: 'index',
      title: 'Standalone',
      Component: () => <div>Standalone settings page</div>,
      sort: -1000,
    });
  }
}

class MultiPortalSettingsPlugin extends Plugin {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'multi-portal',
      title: 'Portal manager',
      aclSnippet: 'pm.multi-portal',
      sort: -300,
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'multi-portal',
      key: 'index',
      title: 'Portal manager',
      aclSnippet: 'pm.multi-portal',
      Component: () => <div>Portal manager page</div>,
    });
  }
}

class PrimarySettingsPlugin extends Plugin {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'portal-manager',
      title: 'Portal manager',
      sort: -300,
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'portal-manager',
      key: 'index',
      title: 'Portal manager',
      Component: () => <div>Portal manager page</div>,
    });
  }
}

let recheckRole: (() => Promise<void>) | null = null;

const RoleRecheckPage = () => {
  recheckRole = useRoleRecheck();
  return <div>Role recheck page</div>;
};

class RoleRecheckSettingsPlugin extends Plugin {
  async load() {
    this.pluginSettingsManager.addMenuItem({ key: 'role-recheck', title: 'Role recheck' });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'role-recheck',
      key: 'index',
      title: 'Role recheck',
      Component: RoleRecheckPage,
    });
  }
}

describe('standalone settings layout root', () => {
  const originalLocation = window.location;
  const originalModernClientPrefix = window.__nocobase_modern_client_prefix__;

  afterEach(() => {
    recheckRole = null;
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    if (originalModernClientPrefix === undefined) {
      delete window.__nocobase_modern_client_prefix__;
    } else {
      window.__nocobase_modern_client_prefix__ = originalModernClientPrefix;
    }
  });

  it.each(['/settings', '/settings/', '/settings/index'])(
    'redirects %s to multi-portal when it is accessible',
    async (initialEntry) => {
      const app = new SettingsApplication({
        plugins: [SettingsBuildInPlugin, MultiPortalSettingsPlugin],
        router: { type: 'memory', initialEntries: [initialEntry] },
        ws: false,
      });
      const apiMock = new MockAdapter(app.apiClient.axios);
      app.dataSourceManager.ensureLoaded = async () => {};
      apiMock.onGet('app:getLang').reply(200, {
        data: { lang: 'en-US', resources: { client: {} }, cron: {} },
      });
      apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
      apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
      apiMock.onGet('systemSettings:get').reply(200, {
        data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
      });

      const Root = app.getRootComponent();
      render(<Root />);

      await waitFor(() => {
        expect(app.router.state.location.pathname).toBe('/settings/multi-portal');
      });
    },
  );

  it('falls back to system-settings when multi-portal is not registered', async () => {
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, StandaloneSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/settings/system-settings');
    });
  });

  it('falls back to system-settings when multi-portal is not accessible', async () => {
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').reply(200, {
      data: { role: 'member', snippets: ['!pm.multi-portal'] },
    });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(app.router.state.location.pathname).toBe('/settings/system-settings');
    });
  });

  it('keeps ordinary negative-sort settings in the active Settings group sidebar', async () => {
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, PrimarySettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/portal-manager'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').reply(200, {
      data: { role: 'root', snippets: ['pm'] },
    });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('Portal manager page')).toBeInTheDocument();

    const portalManagerItem = screen.getByRole('menuitem', { name: 'Portal manager' });
    const sidebar = portalManagerItem.closest('aside');
    expect(sidebar).toBeInTheDocument();
    if (!sidebar) {
      throw new Error('Expected the Portal manager item to render in the Settings sidebar');
    }
    expect(within(sidebar).queryByRole('menuitem', { name: /Plugin manager$/ })).not.toBeInTheDocument();
  });

  it('uses document navigation to the standalone Settings signin page when unauthenticated', async () => {
    const replace = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    window.__nocobase_modern_client_prefix__ = 'v';
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin],
      router: { type: 'memory', initialEntries: ['/settings/workflow?tab=list#recent'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });
    apiMock.onGet('/auth:check').reply(200, { data: {} });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/settings/signin?redirect=%2Fsettings%2Fworkflow%3Ftab%3Dlist%23recent');
    });
  });

  it('does not render the Settings header before the initial auth check completes', async () => {
    let resolveAuthCheck: (response: [number, { data: { id: number } }]) => void = () => {
      throw new Error('Auth check resolver is not initialized');
    };
    const authCheckResponse = new Promise<[number, { data: { id: number } }]>((resolve) => {
      resolveAuthCheck = resolve;
    });
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin],
      router: { type: 'memory', initialEntries: ['/settings'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(() => authCheckResponse);
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(apiMock.history.get.some((request) => request.url === '/auth:check')).toBe(true);
    });
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();

    resolveAuthCheck([200, { data: { id: 1 } }]);
    expect(await screen.findByRole('banner')).toBeInTheDocument();
  });

  it('does not render Settings navigation or search before the initial role check completes', async () => {
    let resolveRoleCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Role check resolver is not initialized');
    };
    const roleCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveRoleCheck = resolve;
    });
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/system-settings'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').reply(() => roleCheckResponse);
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(apiMock.history.get.some((request) => request.url === 'roles:check')).toBe(true);
    });
    const header = await screen.findByRole('banner');
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument();
    expect(within(header).queryByTitle('Search settings')).not.toBeInTheDocument();

    resolveRoleCheck([200, { data: { role: 'root', snippets: ['pm'] } }]);
    await waitFor(() => {
      expect(within(header).getByRole('menu')).toBeInTheDocument();
      expect(within(header).getByTitle('Search settings')).toBeInTheDocument();
    });
  });

  it('keeps Settings navigation hidden until the latest overlapping role check completes', async () => {
    let resolveOlderCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Older role check resolver is not initialized');
    };
    let resolveLatestCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Latest role check resolver is not initialized');
    };
    const olderCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveOlderCheck = resolve;
    });
    const latestCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveLatestCheck = resolve;
    });
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin, RoleRecheckSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/role-recheck'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').replyOnce(200, { data: { role: 'root', snippets: ['pm'] } });
    apiMock.onGet('roles:check').replyOnce(() => olderCheckResponse);
    apiMock.onGet('roles:check').replyOnce(() => latestCheckResponse);
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('Role recheck page')).toBeInTheDocument();
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('menu')).toBeInTheDocument();
    if (!recheckRole) {
      throw new Error('Expected the role recheck callback to be available');
    }

    let olderCheck: Promise<void> = Promise.resolve();
    let latestCheck: Promise<void> = Promise.resolve();
    act(() => {
      olderCheck = recheckRole?.() || Promise.resolve();
      latestCheck = recheckRole?.() || Promise.resolve();
    });
    await waitFor(() => {
      expect(apiMock.history.get.filter((request) => request.url === 'roles:check')).toHaveLength(3);
    });
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument();

    await act(async () => {
      resolveOlderCheck([200, { data: { role: 'root', snippets: ['pm'] } }]);
      await olderCheck;
    });
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument();

    await act(async () => {
      resolveLatestCheck([200, { data: { role: 'member', snippets: ['!pm.*'] } }]);
      await latestCheck;
    });
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument();
    expect(within(header).getByTitle('Search settings')).toBeInTheDocument();
  });

  it('ignores a pending role check from an unmounted provider', async () => {
    let resolveUnmountedCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Unmounted role check resolver is not initialized');
    };
    let resolveRemountedCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Remounted role check resolver is not initialized');
    };
    const unmountedCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveUnmountedCheck = resolve;
    });
    const remountedCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveRemountedCheck = resolve;
    });
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin, RoleRecheckSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/role-recheck'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').replyOnce(200, { data: { role: 'root', snippets: ['pm'] } });
    apiMock.onGet('roles:check').replyOnce(() => unmountedCheckResponse);
    apiMock.onGet('roles:check').replyOnce(() => remountedCheckResponse);
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    const firstRender = render(<Root />);

    expect(await screen.findByText('Role recheck page')).toBeInTheDocument();
    if (!recheckRole) {
      throw new Error('Expected the role recheck callback to be available');
    }

    let unmountedCheck: Promise<void> = Promise.resolve();
    act(() => {
      unmountedCheck = recheckRole?.() || Promise.resolve();
    });
    await waitFor(() => {
      expect(apiMock.history.get.filter((request) => request.url === 'roles:check')).toHaveLength(2);
    });

    firstRender.unmount();
    render(<Root />);

    await waitFor(() => {
      expect(apiMock.history.get.filter((request) => request.url === 'roles:check')).toHaveLength(3);
    });
    const remountedHeader = await screen.findByRole('banner');
    expect(within(remountedHeader).queryByRole('menu')).not.toBeInTheDocument();

    await act(async () => {
      resolveUnmountedCheck([200, { data: { role: 'root', snippets: ['pm'] } }]);
      await unmountedCheck;
    });
    expect(within(remountedHeader).queryByRole('menu')).not.toBeInTheDocument();

    await act(async () => {
      resolveRemountedCheck([200, { data: { role: 'member', snippets: ['!pm.*'] } }]);
    });
    await waitFor(() => {
      expect(within(remountedHeader).getByTitle('Search settings')).toBeInTheDocument();
    });
  });

  it('does not reopen Settings search after a role recheck', async () => {
    let resolveRoleCheck: (response: [number, { data: { role: string; snippets: string[] } }]) => void = () => {
      throw new Error('Role check resolver is not initialized');
    };
    const roleCheckResponse = new Promise<[number, { data: { role: string; snippets: string[] } }]>((resolve) => {
      resolveRoleCheck = resolve;
    });
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin, RoleRecheckSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/role-recheck'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').replyOnce(200, { data: { role: 'root', snippets: ['pm'] } });
    apiMock.onGet('roles:check').replyOnce(() => roleCheckResponse);
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('Role recheck page')).toBeInTheDocument();
    const header = await screen.findByRole('banner');
    fireEvent.click(within(header).getByTitle('Search settings'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    if (!recheckRole) {
      throw new Error('Expected the role recheck callback to be available');
    }

    let roleCheck: Promise<void> = Promise.resolve();
    act(() => {
      roleCheck = recheckRole?.() || Promise.resolve();
    });
    await waitFor(() => {
      expect(apiMock.history.get.filter((request) => request.url === 'roles:check')).toHaveLength(2);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveRoleCheck([200, { data: { role: 'member', snippets: ['!pm.*'] } }]);
      await roleCheck;
    });
    expect(within(header).getByTitle('Search settings')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Settings navigation and search unavailable when the initial role check fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/system-settings'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').reply(500, { errors: [{ message: 'Temporary failure' }] });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(apiMock.history.get.some((request) => request.url === 'roles:check')).toBe(true);
    });
    const header = await screen.findByRole('banner');
    expect(within(header).queryByRole('menu')).not.toBeInTheDocument();
    expect(within(header).queryByTitle('Search settings')).not.toBeInTheDocument();

    const isMac = /Mac|iPhone|iPad/.test(window.navigator.platform || '');
    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'f',
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, shortcutEvent);
    expect(shortcutEvent.defaultPrevented).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores the last successful Settings readiness after a recheck error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = new SettingsApplication({
      plugins: [SettingsBuildInPlugin, TestAclPlugin, MultiPortalSettingsPlugin, RoleRecheckSettingsPlugin],
      router: { type: 'memory', initialEntries: ['/settings/role-recheck'] },
      ws: false,
    });
    const apiMock = new MockAdapter(app.apiClient.axios);
    app.dataSourceManager.ensureLoaded = async () => {};
    apiMock.onGet('app:getLang').reply(200, {
      data: { lang: 'en-US', resources: { client: {} }, cron: {} },
    });
    apiMock.onGet('/auth:check').reply(200, { data: { id: 1, nickname: 'Admin' } });
    apiMock.onGet('app:getInfo').reply(200, { data: { id: 'mock-app', version: 'test' } });
    apiMock.onGet('roles:check').replyOnce(200, { data: { role: 'root', snippets: ['pm'] } });
    apiMock.onGet('roles:check').replyOnce(500, { errors: [{ message: 'Temporary failure' }] });
    apiMock.onGet('systemSettings:get').reply(200, {
      data: { id: 1, title: 'NocoBase', raw_title: 'NocoBase', logo: null },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByText('Role recheck page')).toBeInTheDocument();
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('menu')).toBeInTheDocument();
    if (!recheckRole) {
      throw new Error('Expected the role recheck callback to be available');
    }

    await act(async () => {
      await recheckRole?.();
    });
    expect(within(header).getByRole('menu')).toBeInTheDocument();
  });
});
