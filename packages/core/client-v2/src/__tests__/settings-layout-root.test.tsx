/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Plugin } from '../Plugin';
import { SettingsApplication } from '../settings-app/SettingsApplication';
import { SettingsBuildInPlugin } from '../settings-app/SettingsBuildInPlugin';

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

  it('redirects /settings to the first available settings page', async () => {
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

  it('uses document navigation to the existing v2 signin page when unauthenticated', async () => {
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
      expect(replace).toHaveBeenCalledWith('/v/signin?redirect=%2Fsettings%2Fworkflow%3Ftab%3Dlist%23recent');
    });
  });
});
