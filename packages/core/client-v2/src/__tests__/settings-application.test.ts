/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter from 'axios-mock-adapter';
import { describe, expect, it } from 'vitest';
import { Application } from '../index';
import { SettingsApplication } from '../settings-app/SettingsApplication';
import { SettingsBuildInPlugin } from '../settings-app/SettingsBuildInPlugin';

describe('SettingsApplication', () => {
  it('uses the standalone settings route namespace', () => {
    const adminApp = new Application({ router: { type: 'memory' }, ws: false });
    const settingsApp = new SettingsApplication({ router: { type: 'memory' }, ws: false });

    expect(adminApp.pluginSettingsManager.getRouteName('demo.index')).toBe('admin.settings.demo.index');
    expect(adminApp.pluginSettingsManager.getRoutePath('demo.index')).toBe('/admin/settings/demo');

    expect(settingsApp.pluginSettingsManager.getRouteName('demo.index')).toBe('settings.demo.index');
    expect(settingsApp.pluginSettingsManager.getRoutePath('demo.index')).toBe('/settings/demo');
    expect(settingsApp.pluginSettingsManager.getRoutePath('')).toBe('/settings/');
  });

  it('keeps only routes owned by the settings runtime', () => {
    const app = new SettingsApplication({ router: { type: 'memory' }, ws: false });

    app.router.add('settings', { path: '/settings' });
    app.router.add('settings.demo', { path: 'demo' });
    app.router.add('settingsDetails.workflow.canvas', { path: '/settings/workflow/workflows/:id' });
    app.router.add('admin.demo', { path: '/admin/demo' });
    app.router.add('public-forms', { path: '/public-forms/:key' });
    app.router.add('mobile', { path: '/mobile' });

    expect(app.router.has('settings')).toBe(true);
    expect(app.router.has('settings.demo')).toBe(true);
    expect(app.router.get('settingsDetails.workflow.canvas')).toMatchObject({
      path: '/settings/workflow/workflows/:id',
      authCheck: true,
    });
    expect(app.router.has('admin.demo')).toBe(false);
    expect(app.router.has('public-forms')).toBe(false);
    expect(app.router.has('mobile')).toBe(false);
    expect(app.router.has('not-found')).toBe(true);
  });

  it('keeps hidden plugin detail pages in the normal Settings route tree', () => {
    const app = new SettingsApplication({ router: { type: 'memory' }, ws: false });

    app.pluginSettingsManager.addMenuItem({ key: 'public-forms', title: 'Public forms' });
    app.pluginSettingsManager.addPageTabItem({
      menuKey: 'public-forms',
      key: ':name',
      title: false,
      hidden: true,
      Component: () => null,
    });

    expect(app.pluginSettingsManager.get('public-forms.:name')).toMatchObject({
      hidden: true,
      path: '/settings/public-forms/:name',
    });
    expect(app.router.get('settings.public-forms.:name')).toMatchObject({ path: ':name' });
  });

  it('registers the authenticated settings shell without the admin layout', async () => {
    const app = new SettingsApplication({ router: { type: 'memory' }, ws: false });
    const apiMock = new MockAdapter(app.apiClient.axios);
    apiMock.onGet('app:getLang').reply(200, { data: { lang: 'en-US', resources: { client: {} }, cron: {} } });
    const plugin = new SettingsBuildInPlugin({ name: 'settings-buildin' }, app);

    await plugin.afterAdd();
    await plugin.load();
    app.router.add('settingsDetails.workflow.canvas', { path: '/settings/workflow/workflows/:id' });

    expect(app.router.get('settings')).toMatchObject({ path: '/settings', authCheck: true });
    expect(app.router.get('settingsDetails')).toMatchObject({ path: '/settings', authCheck: true });
    expect(
      app.router.matchRoutes('/settings/workflow/workflows/1')?.some((match) => match.route.authCheck === true),
    ).toBe(true);
    expect(app.router.has('admin')).toBe(false);
    expect(app.layoutManager.hasLayout('admin')).toBe(false);
    expect(app.pluginSettingsManager.has('plugin-manager')).toBe(true);
    expect(app.pluginSettingsManager.has('system-settings')).toBe(true);
    expect(app.pluginSettingsManager.has('security')).toBe(true);
  });
});
