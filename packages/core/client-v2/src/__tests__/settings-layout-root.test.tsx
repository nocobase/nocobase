/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACLRolesCheckProvider } from '../acl';
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

describe('standalone settings layout root', () => {
  const originalLocation = window.location;
  const originalModernClientPrefix = window.__nocobase_modern_client_prefix__;

  afterEach(() => {
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

  it('groups negative-sort settings above plugin-manager', async () => {
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
    const pluginManagerItem = screen.getByRole('menuitem', { name: /Plugin manager$/ });
    const menu = portalManagerItem.closest('ul');
    const menuChildren = Array.from(menu?.children || []);
    const portalManagerIndex = menuChildren.indexOf(portalManagerItem);
    const pluginManagerIndex = menuChildren.indexOf(pluginManagerItem);
    const firstDividerIndex = menuChildren.findIndex((item) => item.classList.contains('ant-menu-item-divider'));

    expect(portalManagerIndex).toBeLessThan(pluginManagerIndex);
    expect(pluginManagerIndex).toBeLessThan(firstDividerIndex);
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
});
