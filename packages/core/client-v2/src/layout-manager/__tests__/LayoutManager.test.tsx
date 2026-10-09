/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { matchRoutes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RouterManager } from '../../RouterManager';
import { LayoutManager } from '../LayoutManager';

function createManager() {
  const routes: Record<string, any> = {};
  const app = {
    router: {
      add: vi.fn((name: string, route: any) => {
        routes[name] = route;
      }),
    },
  };

  return {
    app,
    routes,
    manager: new LayoutManager(app as any),
  };
}

describe('LayoutManager', () => {
  it('registers layout with defaults and standard page routes', () => {
    const { manager, routes } = createManager();

    const layout = manager.registerLayout({
      routeName: 'mobile',
      routePath: 'mobile/',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
    });

    expect(layout).toMatchObject({
      routeName: 'mobile',
      routePath: '/mobile',
      rootRouteName: 'mobile',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    });
    expect(routes.mobile).toMatchObject({
      path: '/mobile',
      authCheck: true,
    });
    expect(React.isValidElement(routes.mobile.element)).toBe(true);
    expect(routes['mobile.__page']).toMatchObject({
      path: ':name',
      authCheck: true,
    });
    expect(routes['mobile.__pageTab']).toMatchObject({
      path: ':name/tab/:tabUid',
      authCheck: true,
    });
    expect(routes['mobile.__pageView']).toMatchObject({
      path: ':name/view/*',
      authCheck: true,
    });
    expect(routes['mobile.__pageTabView']).toMatchObject({
      path: ':name/tab/:tabUid/view/*',
      authCheck: true,
    });
  });

  it('registers nested layout route by dotted routeName and relative routePath', () => {
    const { manager, routes } = createManager();

    const layout = manager.registerLayout({
      routeName: 'admin.settings.publicForms',
      routePath: 'public-forms/',
      uid: 'public-form-layout-model',
      layoutModelClass: 'PublicFormLayoutModel',
    });

    expect(layout).toMatchObject({
      routeName: 'admin.settings.publicForms',
      routePath: 'public-forms',
      rootRouteName: 'admin',
    });
    expect(routes['admin.settings.publicForms']).toMatchObject({
      path: 'public-forms',
      authCheck: true,
    });
    expect(routes['admin.settings.publicForms.__pageView']).toMatchObject({
      path: ':name/view/*',
      authCheck: true,
    });
  });

  it('registers nested layout route with empty routePath', () => {
    const { manager, routes } = createManager();

    const layout = manager.registerLayout({
      routeName: 'admin.settings.publicForms.layout',
      routePath: '',
      uid: 'public-form-layout-model',
      layoutModelClass: 'PublicFormLayoutModel',
    });

    expect(layout).toMatchObject({
      routeName: 'admin.settings.publicForms.layout',
      routePath: '',
      rootRouteName: 'admin',
    });
    expect(routes['admin.settings.publicForms.layout']).toMatchObject({
      path: '',
      authCheck: true,
    });
    expect(routes['admin.settings.publicForms.layout.__page']).toMatchObject({
      path: ':name',
      authCheck: true,
    });
    expect(routes['admin.settings.publicForms.layout.__pageTab']).toMatchObject({
      path: ':name/tab/:tabUid',
      authCheck: true,
    });
    expect(routes['admin.settings.publicForms.layout.__pageView']).toMatchObject({
      path: ':name/view/*',
      authCheck: true,
    });
  });

  it('matches nested layout under existing parent route tree', () => {
    const app: any = {
      renderComponent: vi.fn(),
    };
    app.router = new RouterManager({}, app);
    const manager = new LayoutManager(app);

    app.router.add('admin', {
      path: '/admin',
      element: <div />,
    });
    app.router.add('admin.settings', {
      path: '/admin/settings',
      element: <div />,
    });
    app.router.add('admin.settings.route-empty', {
      path: '*',
      element: <div />,
    });
    manager.registerLayout({
      routeName: 'admin.settings.publicForms',
      routePath: 'public-forms',
      uid: 'public-form-layout-model',
      layoutModelClass: 'PublicFormLayoutModel',
    });

    const matches = matchRoutes(app.router.getRoutesTree(), '/admin/settings/public-forms/form-1/view/popup');

    expect(matches?.map((match) => match.route.id)).toEqual([
      'admin',
      'admin.settings',
      'admin.settings.publicForms',
      'admin.settings.publicForms.__pageView',
    ]);
  });

  it('matches empty routePath layout under existing parent route tree', () => {
    const app: any = {
      renderComponent: vi.fn(),
    };
    app.router = new RouterManager({}, app);
    const manager = new LayoutManager(app);

    app.router.add('admin', {
      path: '/admin',
      element: <div />,
    });
    app.router.add('admin.settings', {
      path: '/admin/settings',
      element: <div />,
    });
    app.router.add('admin.settings.publicForms', {
      path: '/admin/settings/public-forms',
      element: <div />,
    });
    manager.registerLayout({
      routeName: 'admin.settings.publicForms.layout',
      routePath: '',
      uid: 'public-form-layout-model',
      layoutModelClass: 'PublicFormLayoutModel',
    });

    const matches = matchRoutes(app.router.getRoutesTree(), '/admin/settings/public-forms/form-1/view/popup');

    expect(matches?.map((match) => match.route.id)).toEqual([
      'admin',
      'admin.settings',
      'admin.settings.publicForms',
      'admin.settings.publicForms.layout',
      'admin.settings.publicForms.layout.__pageView',
    ]);
  });

  it('allows explicit page model classes and authCheck', () => {
    const { manager, routes } = createManager();

    expect(
      manager.registerLayout({
        routeName: 'embed',
        routePath: '/embed',
        uid: 'embed-layout-model',
        layoutModelClass: 'EmbedLayoutModelV2',
        rootPageModelClass: 'EmbedRootPageModel',
        childPageModelClass: 'EmbedChildPageModel',
        authCheck: false,
        storageScope: {
          storageType: 'sessionStorage',
          prefix: 'EMBED',
        },
      }),
    ).toMatchObject({
      rootPageModelClass: 'EmbedRootPageModel',
      childPageModelClass: 'EmbedChildPageModel',
      authCheck: false,
      storageScope: {
        storageType: 'sessionStorage',
        prefix: 'EMBED',
      },
    });
    expect(routes.embed).toMatchObject({
      authCheck: false,
      skipAuthCheck: true,
    });
    expect(routes['embed.__page']).toMatchObject({
      authCheck: false,
      skipAuthCheck: true,
    });
  });

  it('validates public fields', () => {
    const { manager } = createManager();

    expect(() =>
      manager.registerLayout({
        routeName: '.bad',
        routePath: '/bad',
        uid: 'bad-layout-model',
        layoutModelClass: 'BadLayoutModel',
      }),
    ).toThrowError(/invalid routeName/);
    expect(() =>
      manager.registerLayout({
        routeName: 'root',
        routePath: '/',
        uid: 'root-layout-model',
        layoutModelClass: 'RootLayoutModel',
      }),
    ).toThrowError(/root routePath/);
    expect(() =>
      manager.registerLayout({
        routeName: 'emptyRoot',
        routePath: '',
        uid: 'empty-root-layout-model',
        layoutModelClass: 'EmptyRootLayoutModel',
      }),
    ).toThrowError(/root routePath/);
    expect(() =>
      manager.registerLayout({
        routeName: 'admin.settings.bad',
        routePath: '/bad',
        uid: 'bad-nested-layout-model',
        layoutModelClass: 'BadNestedLayoutModel',
      }),
    ).toThrowError(/must be relative/);
    expect(() =>
      manager.registerLayout({
        routeName: '',
        routePath: '/empty',
        uid: 'empty-layout-model',
        layoutModelClass: 'EmptyLayoutModel',
      }),
    ).toThrowError(/routeName/);
    expect(() =>
      manager.registerLayout({
        routeName: 'badRootModel',
        routePath: '/bad-root-model',
        uid: 'bad-root-model-layout-model',
        layoutModelClass: 'BadRootModelLayoutModel',
        rootPageModelClass: '' as any,
      }),
    ).toThrowError(/rootPageModelClass/);
    expect(() =>
      manager.registerLayout({
        routeName: 'badChildModel',
        routePath: '/bad-child-model',
        uid: 'bad-child-model-layout-model',
        layoutModelClass: 'BadChildModelLayoutModel',
        childPageModelClass: {} as any,
      }),
    ).toThrowError(/childPageModelClass/);
    expect(() =>
      manager.registerLayout({
        routeName: 'badAuthCheck',
        routePath: '/bad-auth-check',
        uid: 'bad-auth-check-layout-model',
        layoutModelClass: 'BadAuthCheckLayoutModel',
        authCheck: 'false' as any,
      }),
    ).toThrowError(/authCheck/);
    [
      { value: 'sessionStorage', error: /storageScope/ },
      { value: { storageType: 'indexedDB', prefix: 'BAD' }, error: /storageScope.storageType/ },
      { value: { storageType: 'sessionStorage', prefix: '' }, error: /storageScope.prefix/ },
    ].forEach(({ value, error }) => {
      expect(() =>
        manager.registerLayout({
          routeName: 'badStorageScope',
          routePath: '/bad-storage-scope',
          uid: 'bad-storage-scope-layout-model',
          layoutModelClass: 'BadStorageScopeLayoutModel',
          storageScope: value as any,
        }),
      ).toThrowError(error);
    });
  });

  it('rejects duplicate routeName or uid', () => {
    const { manager } = createManager();

    manager.registerLayout({
      routeName: 'admin',
      routePath: '/admin',
      uid: 'admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
    });

    expect(() =>
      manager.registerLayout({
        routeName: 'admin',
        routePath: '/admin2',
        uid: 'admin-layout-model-2',
        layoutModelClass: 'AdminLayoutModel2',
      }),
    ).toThrowError(/already been registered/);
    expect(() =>
      manager.registerLayout({
        routeName: 'admin3',
        routePath: '/admin3',
        uid: 'admin-layout-model',
        layoutModelClass: 'AdminLayoutModel3',
      }),
    ).toThrowError(/uid 'admin-layout-model'/);
  });
});
