/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
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
  it('registers layout with defaults and catch-all content route', () => {
    const { manager, routes } = createManager();

    const layout = manager.registerLayout({
      name: 'mobile',
      basePath: 'mobile/',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
    });

    expect(layout).toMatchObject({
      name: 'mobile',
      basePath: '/mobile',
      normalizedBasePath: 'mobile',
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
    expect(routes['mobile.__layoutContent']).toMatchObject({
      path: '*',
      authCheck: true,
    });
    expect(routes['mobile.page']).toBeUndefined();
  });

  it('allows explicit page model classes and authCheck', () => {
    const { manager } = createManager();

    expect(
      manager.registerLayout({
        name: 'embed',
        basePath: '/embed',
        uid: 'embed-layout-model',
        layoutModelClass: 'EmbedLayoutModelV2',
        rootPageModelClass: 'EmbedRootPageModel',
        childPageModelClass: 'EmbedChildPageModel',
        authCheck: false,
      }),
    ).toMatchObject({
      rootPageModelClass: 'EmbedRootPageModel',
      childPageModelClass: 'EmbedChildPageModel',
      authCheck: false,
    });
  });

  it('validates public fields', () => {
    const { manager } = createManager();

    expect(() =>
      manager.registerLayout({
        name: 'bad.name',
        basePath: '/bad',
        uid: 'bad-layout-model',
        layoutModelClass: 'BadLayoutModel',
      }),
    ).toThrowError(/does not allow '\.'/);
    expect(() =>
      manager.registerLayout({
        name: 'root',
        basePath: '/',
        uid: 'root-layout-model',
        layoutModelClass: 'RootLayoutModel',
      }),
    ).toThrowError(/root basePath/);
    expect(() =>
      manager.registerLayout({
        name: '',
        basePath: '/empty',
        uid: 'empty-layout-model',
        layoutModelClass: 'EmptyLayoutModel',
      }),
    ).toThrowError(/name/);
    expect(() =>
      manager.registerLayout({
        name: 'badRootModel',
        basePath: '/bad-root-model',
        uid: 'bad-root-model-layout-model',
        layoutModelClass: 'BadRootModelLayoutModel',
        rootPageModelClass: '' as any,
      }),
    ).toThrowError(/rootPageModelClass/);
    expect(() =>
      manager.registerLayout({
        name: 'badChildModel',
        basePath: '/bad-child-model',
        uid: 'bad-child-model-layout-model',
        layoutModelClass: 'BadChildModelLayoutModel',
        childPageModelClass: {} as any,
      }),
    ).toThrowError(/childPageModelClass/);
    expect(() =>
      manager.registerLayout({
        name: 'badAuthCheck',
        basePath: '/bad-auth-check',
        uid: 'bad-auth-check-layout-model',
        layoutModelClass: 'BadAuthCheckLayoutModel',
        authCheck: 'false' as any,
      }),
    ).toThrowError(/authCheck/);
  });

  it('rejects duplicate name or basePath', () => {
    const { manager } = createManager();

    manager.registerLayout({
      name: 'admin',
      basePath: '/admin',
      uid: 'admin-layout-model',
      layoutModelClass: 'AdminLayoutModel',
    });

    expect(() =>
      manager.registerLayout({
        name: 'admin',
        basePath: '/admin2',
        uid: 'admin-layout-model-2',
        layoutModelClass: 'AdminLayoutModel2',
      }),
    ).toThrowError(/already been registered/);
    expect(() =>
      manager.registerLayout({
        name: 'admin2',
        basePath: 'admin/',
        uid: 'admin-layout-model-3',
        layoutModelClass: 'AdminLayoutModel3',
      }),
    ).toThrowError(/basePath '\/admin'/);
    expect(() =>
      manager.registerLayout({
        name: 'admin3',
        basePath: '/admin3',
        uid: 'admin-layout-model',
        layoutModelClass: 'AdminLayoutModel3',
      }),
    ).toThrowError(/uid 'admin-layout-model'/);
  });
});
