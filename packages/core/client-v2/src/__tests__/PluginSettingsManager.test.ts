/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { createMockClient } from '@nocobase/client-v2';

describe('PluginSettingsManager v2', () => {
  it('should return menu -> page two-level structure', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo', showTabs: true });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'advanced', title: 'Advanced', sort: 10 });

    const list = app.pluginSettingsManager.getList();

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      key: 'demo',
      name: 'demo',
      menuKey: 'demo',
      isTopLevel: true,
      topLevelName: 'demo',
      showTabs: true,
    });
    expect(list[0].children?.map((item) => item.name)).toEqual(['demo.index', 'demo.advanced']);
    expect(list[0].children?.[0]).toMatchObject({
      key: 'demo.index',
      menuKey: 'demo',
      pageKey: 'index',
      path: '/admin/settings/demo',
      children: undefined,
      isTopLevel: false,
    });
  });

  it('should return snapshots that do not mutate internal state', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });

    const menu = app.pluginSettingsManager.get('demo') as any;
    const list = app.pluginSettingsManager.getList() as any[];

    menu.title = 'Changed';
    menu.children[0].title = 'Changed child';
    list[0].children = [] as any;

    expect(app.pluginSettingsManager.get('demo')).toMatchObject({ title: 'Demo' });
    expect(app.pluginSettingsManager.get('demo.index')).toMatchObject({ title: 'Overview' });
    expect(app.pluginSettingsManager.getList()[0].children).toHaveLength(1);
  });

  it('should respect route path rules for menu and index page', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'advanced', title: 'Advanced' });

    expect(app.pluginSettingsManager.getRouteName('demo')).toBe('admin.settings.demo');
    expect(app.pluginSettingsManager.getRouteName('demo.advanced')).toBe('admin.settings.demo.advanced');
    expect(app.pluginSettingsManager.getRoutePath('demo')).toBe('/admin/settings/demo');
    expect(app.pluginSettingsManager.getRoutePath('demo.index')).toBe('/admin/settings/demo');
    expect(app.pluginSettingsManager.getRoutePath('demo.advanced')).toBe('/admin/settings/demo/advanced');

    expect(app.router.get('admin.settings.demo')).toMatchObject({ path: 'demo' });
    expect(app.router.get('admin.settings.demo.index')).toMatchObject({ index: true });
    expect(app.router.get('admin.settings.demo.advanced')).toMatchObject({ path: 'advanced' });
  });

  it('should support componentLoader on page item', () => {
    const app = createMockClient();
    const componentLoader = async () => ({
      default: () => React.createElement('div', null, 'hello'),
    });

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({
      menuKey: 'demo',
      key: 'index',
      title: 'Overview',
      componentLoader,
    });

    expect(app.pluginSettingsManager.get('demo.index')).toMatchObject({ componentLoader });
    expect(app.router.get('admin.settings.demo.index')).toMatchObject({ componentLoader, index: true });
  });

  it('should merge duplicate registration and refresh route config', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo', showTabs: true });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'advanced', title: 'Advanced', sort: 1 });
    app.pluginSettingsManager.addPageTabItem({
      menuKey: 'demo',
      key: 'advanced',
      title: 'Advanced next',
      hidden: true,
    });

    expect(app.pluginSettingsManager.get('demo.advanced')).toMatchObject({
      title: 'Advanced next',
      sort: 1,
      hidden: true,
    });
    expect(app.router.get('admin.settings.demo.advanced')).toMatchObject({ path: 'advanced' });
  });

  it('should remove menu and page correctly', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'advanced', title: 'Advanced' });

    app.pluginSettingsManager.remove('demo.advanced');
    expect(app.pluginSettingsManager.has('demo.advanced')).toBe(false);
    expect(app.pluginSettingsManager.has('demo')).toBe(true);

    app.pluginSettingsManager.remove('demo');
    expect(app.pluginSettingsManager.has('demo')).toBe(false);
    expect(app.pluginSettingsManager.has('demo.index')).toBe(false);
    expect(app.pluginSettingsManager.getList()).toEqual([]);

    expect(() => app.pluginSettingsManager.remove('missing')).not.toThrow();
  });

  it('should keep hidden items in query result when auth passes', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo', hidden: true });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview', hidden: true });

    expect(app.pluginSettingsManager.get('demo')).toMatchObject({ hidden: true });
    expect(app.pluginSettingsManager.get('demo.index')).toMatchObject({ hidden: true });
    expect(app.pluginSettingsManager.getList()[0].children?.[0]).toMatchObject({ hidden: true });
  });

  it('should filter by acl when requested but keep hidden unrelated to acl', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview', hidden: true });
    app.pluginSettingsManager.addPageTabItem({
      menuKey: 'demo',
      key: 'blocked',
      title: 'Blocked',
      aclSnippet: 'pm.demo.blocked',
    });
    app.pluginSettingsManager.setAclSnippets(['!pm.demo.blocked']);

    expect(app.pluginSettingsManager.get('demo.index')).toMatchObject({ hidden: true, isAllow: true });
    expect(app.pluginSettingsManager.get('demo.blocked')).toBeNull();
    expect(app.pluginSettingsManager.get('demo.blocked', false)).toMatchObject({ isAllow: false });
    expect(app.pluginSettingsManager.get('demo')?.children?.map((item) => item.name)).toEqual(['demo.index']);
  });

  it('should throw when page menu does not exist', () => {
    const app = createMockClient();

    expect(() => {
      app.pluginSettingsManager.addPageTabItem({ menuKey: 'missing', key: 'index', title: 'Overview' });
    }).toThrow(/menuKey=missing/);
  });

  it('should reject dotted menu keys in public api', () => {
    const app = createMockClient();

    expect(() => {
      app.pluginSettingsManager.addMenuItem({ key: 'demo.group', title: 'Demo' });
    }).toThrow(/key=demo\.group/);

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });

    expect(() => {
      app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo.group', key: 'index', title: 'Overview' });
    }).toThrow(/menuKey=demo\.group/);
  });

  it('should keep menu visible when menu acl is denied but child page remains visible', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo', aclSnippet: 'pm.demo.menu' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });
    app.pluginSettingsManager.setAclSnippets(['!pm.demo.menu']);

    const menu = app.pluginSettingsManager.get('demo');

    expect(menu).toMatchObject({
      name: 'demo',
      isAllow: true,
    });
    expect(menu?.children?.map((item) => item.name)).toEqual(['demo.index']);
    expect(app.pluginSettingsManager.getList().map((item) => item.name)).toEqual(['demo']);
  });

  it('should allow updating same index page registration', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview' });

    expect(() => {
      app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'index', title: 'Overview next' });
    }).not.toThrow();

    expect(app.pluginSettingsManager.get('demo.index')).toMatchObject({ title: 'Overview next' });
  });

  it('should throw when different keys produce same path', () => {
    const app = createMockClient();

    app.pluginSettingsManager.addMenuItem({ key: 'demo', title: 'Demo' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'demo', key: 'advanced', title: 'Advanced' });

    expect(() => {
      app.pluginSettingsManager.addMenuItem({ key: 'demo/advanced', title: 'Bad menu' });
    }).toThrow(/path=\/admin\/settings\/demo\/advanced/);
  });
});
