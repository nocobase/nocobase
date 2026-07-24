/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfaceRouteSync } from '../flow-surfaces/route-sync';

function createPageRoute(options: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    type: 'flowPage',
    schemaUid: 'page-1',
    title: 'Page 1',
    enableTabs: true,
    displayTitle: true,
    options,
    children: [
      {
        id: 2,
        parentId: 1,
        type: 'tabs',
        schemaUid: 'tab-1',
        title: 'Hidden tab',
        hidden: true,
      },
    ],
    ...overrides,
  };
}

function createRouteSync(initialPageModel?: Record<string, unknown> | null) {
  let pageModel = initialPageModel;
  const repository = {
    findModelByParentId: vi.fn(async (_parentId: string, options: { subKey?: string }) =>
      options.subKey === 'page' ? pageModel : null,
    ),
    findModelById: vi.fn().mockResolvedValue(null),
    patch: vi.fn(),
    remove: vi.fn(),
  };
  const desktopRoutes = {
    findOne: vi.fn(),
    update: vi.fn(),
  };
  const routeSync = new FlowSurfaceRouteSync(
    {
      getRepository: vi.fn(() => desktopRoutes),
    } as never,
    repository as never,
  );

  return {
    repository,
    routeSync,
    setPageModel(value: Record<string, unknown> | null) {
      pageModel = value;
    },
  };
}

describe('FlowSurfaceRouteSync JS page synthesis', () => {
  it.each([
    ['plain options', createPageRoute({ pageType: 'js-page' })],
    [
      'Sequelize dataValues options',
      createPageRoute(undefined, {
        dataValues: {
          options: {
            pageType: 'js-page',
          },
        },
      }),
    ],
  ])('synthesizes JSPageModel from %s and preserves the hidden tab anchor', async (_label, route) => {
    const { routeSync } = createRouteSync(null);

    const tree = await routeSync.buildPageTree(route);

    expect(tree).toMatchObject({
      uid: 'page-1',
      use: 'JSPageModel',
      props: {
        enableTabs: false,
      },
      stepParams: {
        pageSettings: {
          general: {
            enableTabs: false,
          },
        },
      },
    });
    expect(tree.subModels.tabs).toHaveLength(1);
    expect(tree.subModels.tabs[0]).toMatchObject({
      uid: 'tab-1',
      use: 'RootPageTabModel',
      props: {
        route: {
          hidden: true,
        },
      },
    });
  });

  it.each([
    ['JSPageModel', { pageType: undefined }],
    ['CustomRootPageModel', { pageType: 'js-page' }],
  ])('keeps persisted %s ahead of route metadata', async (use, routeOptions) => {
    const { routeSync } = createRouteSync({
      uid: 'persisted-page',
      use,
      props: {
        persisted: true,
      },
    });

    const tree = await routeSync.buildPageTree(createPageRoute(routeOptions));

    expect(tree).toMatchObject({
      uid: 'persisted-page',
      use,
      props: {
        persisted: true,
      },
    });
  });

  it.each([[null], [undefined], [{ pageType: 'unknown-page-type' }]])(
    'falls back to RootPageModel for non-JS options %j',
    async (options) => {
      const { routeSync } = createRouteSync(null);

      const tree = await routeSync.buildPageTree(createPageRoute(options));

      expect(tree.use).toBe('RootPageModel');
    },
  );

  it('keeps synthetic and lazy-created root use aligned without writes', async () => {
    const { repository, routeSync, setPageModel } = createRouteSync(null);
    const route = createPageRoute({ pageType: 'js-page' });

    const synthetic = await routeSync.buildPageTree(route);
    setPageModel({
      uid: 'lazy-page',
      use: 'JSPageModel',
      props: {},
    });
    const persisted = await routeSync.buildPageTree(route);

    expect(synthetic.use).toBe('JSPageModel');
    expect(persisted.use).toBe(synthetic.use);
    expect(repository.patch).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
