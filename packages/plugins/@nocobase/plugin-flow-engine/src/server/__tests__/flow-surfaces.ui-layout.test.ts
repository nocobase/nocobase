/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test';
import { getData, readErrorMessage } from './flow-surfaces.contract.helpers';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const DEFAULT_ADMIN_UI_LAYOUT_UID = 'admin-layout-model';
const DEFAULT_MOBILE_UI_LAYOUT_UID = 'mobile-layout-model';
const DISABLED_UI_LAYOUT_UID = 'flow-surface-disabled-layout-model';

function findRouteBySchemaUid(routes: any[], schemaUid: string): any {
  for (const route of routes || []) {
    if (route?.schemaUid === schemaUid) {
      return route;
    }
    const found = findRouteBySchemaUid(route?.children || [], schemaUid);
    if (found) {
      return found;
    }
  }
}

async function readRouteLayoutUids(app: MockServer, routeId: string | number) {
  const route = await app.db.getRepository('desktopRoutes').findOne({
    filterByTk: routeId,
    appends: ['uiLayouts'],
  });
  return (route?.get('uiLayouts') || []).map((layout: any) => layout.get('uid'));
}

function isRootRoute(route: any) {
  return route?.get('parentId') == null;
}

describe('flowSurfaces UI layout integration', () => {
  let app: MockServer;
  let rootAgent: any;
  let memberAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer({
      plugins: [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, 'ui-layout'] as any,
      enabledPluginAliases: [...FLOW_SURFACES_TEST_PLUGINS, 'ui-layout'],
    });
    rootAgent = await loginFlowSurfacesRootAgent(app);
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: ['member'],
      },
    });
    memberAgent = await app.agent().login(memberUser);
  }, 120000);

  afterAll(async () => {
    await app?.destroy();
  });

  it('should keep default Admin navigation available when Multi-portal is absent', async () => {
    const targets = getData(
      await rootAgent.resource('flowSurfaces').listNavigationTargets({
        values: {},
      }),
    );

    expect(targets.capabilities).toEqual({ multiPortal: false });
    expect(targets.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'layout',
          uid: DEFAULT_ADMIN_UI_LAYOUT_UID,
          default: true,
        }),
      ]),
    );
    expect(targets.targets.some((target: any) => target.kind === 'portal')).toBe(false);
  });

  it('should reject explicit portal targeting when Multi-portal is absent', async () => {
    const response = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: `Unsupported portal group ${Date.now()}`,
        icon: 'AppstoreOutlined',
        portalUid: 'missing-portal',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.[0]?.ruleId).toBe('navigation-portal-unsupported');
  });

  it('should make applyBlueprint pages accessible inside the parent menu layout', async () => {
    const group = getData(
      await rootAgent.resource('desktopRoutes').create({
        values: {
          type: 'group',
          title: 'Flow surface layout group',
          icon: 'AppstoreOutlined',
        },
      }),
    );

    const created = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            group: {
              routeId: group.id,
            },
            item: {
              title: 'Flow surface layout page',
              icon: 'FileOutlined',
            },
          },
          page: {
            title: 'Flow surface layout page',
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Layout-visible page content',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const pageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: created.surface.pageRoute.id,
      appends: ['uiLayouts', 'children'],
    });
    const pageLayoutUids = (pageRoute?.get('uiLayouts') || []).map((layout: any) => layout.get('uid'));
    expect(pageLayoutUids).toContain(DEFAULT_ADMIN_UI_LAYOUT_UID);

    const tabRoute = pageRoute?.get('children')?.[0];
    const persistedTabRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: tabRoute?.get('id'),
      appends: ['uiLayouts'],
    });
    const tabLayoutUids = (persistedTabRoute?.get('uiLayouts') || []).map((layout: any) => layout.get('uid'));
    expect(tabLayoutUids).toContain(DEFAULT_ADMIN_UI_LAYOUT_UID);

    const accessibleRoutes = getData(
      await memberAgent.get('/desktopRoutes:listAccessible').query({
        tree: true,
        sort: 'sort',
        layout: DEFAULT_ADMIN_UI_LAYOUT_UID,
      }),
    );
    expect(findRouteBySchemaUid(accessibleRoutes, created.target.pageSchemaUid)?.id).toBe(created.surface.pageRoute.id);
  });

  it('should create applyBlueprint pages as root tabs inside an explicit mobile layout', async () => {
    const groupTitle = `Flow surface ignored mobile group ${Date.now()}`;
    const pageTitle = `Flow surface mobile root page ${Date.now()}`;
    const created = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
            group: {
              title: groupTitle,
            },
            item: {
              title: pageTitle,
              icon: 'FileOutlined',
            },
          },
          page: {
            title: pageTitle,
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Mobile layout-visible page content',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const pageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: created.surface.pageRoute.id,
      appends: ['children'],
    });
    const tabRoute = pageRoute?.get('children')?.[0];

    expect(pageRoute?.get('type')).toBe('flowPage');
    expect(isRootRoute(pageRoute)).toBe(true);
    expect(await readRouteLayoutUids(app, created.surface.pageRoute.id)).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);
    expect(await readRouteLayoutUids(app, tabRoute?.get('id'))).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);
    const ignoredGroups = await app.db.getRepository('desktopRoutes').find({
      filter: {
        type: 'group',
        title: groupTitle,
      },
    });
    expect(ignoredGroups).toHaveLength(0);

    const mobileRoutes = getData(
      await memberAgent.get('/desktopRoutes:listAccessible').query({
        tree: true,
        sort: 'sort',
        layout: DEFAULT_MOBILE_UI_LAYOUT_UID,
      }),
    );
    expect(
      mobileRoutes.some(
        (route: any) => route?.schemaUid === created.target.pageSchemaUid && route?.id === created.surface.pageRoute.id,
      ),
    ).toBe(true);

    const adminRoutes = getData(
      await memberAgent.get('/desktopRoutes:listAccessible').query({
        tree: true,
        sort: 'sort',
        layout: DEFAULT_ADMIN_UI_LAYOUT_UID,
      }),
    );
    expect(findRouteBySchemaUid(adminRoutes, created.target.pageSchemaUid)).toBeUndefined();
  });

  it('should replace an existing root mobile applyBlueprint page with the same title', async () => {
    const pageTitle = `Flow surface mobile duplicate root page ${Date.now()}`;
    const first = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
            group: {
              title: `Ignored duplicate mobile group ${Date.now()}`,
            },
            item: {
              title: pageTitle,
              icon: 'FileOutlined',
            },
          },
          page: {
            title: pageTitle,
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Initial mobile page content',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const second = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
            item: {
              title: pageTitle,
              icon: 'FileOutlined',
            },
          },
          page: {
            title: pageTitle,
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Updated mobile page content',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    expect(second.mode).toBe('replace');
    expect(second.target.pageSchemaUid).toBe(first.target.pageSchemaUid);
    const rootPages = await app.db.getRepository('desktopRoutes').find({
      filter: {
        type: 'flowPage',
        title: pageTitle,
      },
    });
    expect(rootPages.filter((route: any) => isRootRoute(route))).toHaveLength(1);
  });

  it('should create low-level menu and page routes inside an explicit mobile layout', async () => {
    const mobileItem = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
          type: 'item',
          title: 'Flow surface low-level mobile page',
          icon: 'FileOutlined',
        },
      }),
    );

    const createdPage = getData(
      await rootAgent.resource('flowSurfaces').createPage({
        values: {
          layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
          menuRouteId: mobileItem.routeId,
          title: 'Flow surface low-level mobile page',
        },
      }),
    );
    const mobileRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: createdPage.routeId,
      appends: ['children'],
    });
    const mobileTabRoute = mobileRoute?.get('children')?.[0];

    expect(await readRouteLayoutUids(app, createdPage.routeId)).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);
    expect(await readRouteLayoutUids(app, mobileTabRoute?.get('id'))).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);

    const adminItem = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'item',
          title: 'Flow surface low-level admin-only page',
          icon: 'FileOutlined',
        },
      }),
    );
    const mismatchResponse = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
        menuRouteId: adminItem.routeId,
        title: 'Flow surface low-level mismatch page',
      },
    });

    expect(mismatchResponse.status, readErrorMessage(mismatchResponse)).toBe(400);
    expect(mismatchResponse.body?.errors?.[0]?.ruleId).toBe('navigation-route-layout-mismatch');
  });

  it('should scope same-title navigation group reuse by layout', async () => {
    const sharedGroupTitle = `Flow surface shared layout group ${Date.now()}`;
    const adminCreated = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            group: {
              title: sharedGroupTitle,
              icon: 'AppstoreOutlined',
            },
            item: {
              title: 'Flow surface shared admin page',
              icon: 'FileOutlined',
            },
          },
          page: {
            title: 'Flow surface shared admin page',
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Admin shared group page',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const mobileCreated = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
            group: {
              title: sharedGroupTitle,
              icon: 'AppstoreOutlined',
            },
            item: {
              title: 'Flow surface shared mobile page',
              icon: 'FileOutlined',
            },
          },
          page: {
            title: 'Flow surface shared mobile page',
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Mobile shared group page',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const adminPageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: adminCreated.surface.pageRoute.id,
    });
    const mobilePageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: mobileCreated.surface.pageRoute.id,
    });

    expect(isRootRoute(mobilePageRoute)).toBe(true);
    expect(await readRouteLayoutUids(app, adminPageRoute?.get('parentId'))).toEqual([DEFAULT_ADMIN_UI_LAYOUT_UID]);
    expect(await readRouteLayoutUids(app, mobileCreated.surface.pageRoute.id)).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);
    const sharedGroups = await app.db.getRepository('desktopRoutes').find({
      filter: {
        type: 'group',
        title: sharedGroupTitle,
      },
    });
    expect(sharedGroups).toHaveLength(1);

    const secondAdminCreated = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            group: {
              title: sharedGroupTitle,
            },
            item: {
              title: 'Flow surface shared second admin page',
              icon: 'FileOutlined',
            },
          },
          page: {
            title: 'Flow surface shared second admin page',
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'Second admin shared group page',
                  },
                },
              ],
            },
          ],
        },
      }),
    );
    const secondAdminPageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: secondAdminCreated.surface.pageRoute.id,
    });

    expect(String(secondAdminPageRoute?.get('parentId'))).toBe(String(adminPageRoute?.get('parentId')));
    expect(await readRouteLayoutUids(app, secondAdminCreated.surface.pageRoute.id)).toEqual([
      DEFAULT_ADMIN_UI_LAYOUT_UID,
    ]);
  });

  it('should ignore explicit navigation group route ids for mobile applyBlueprint pages', async () => {
    const adminGroup = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'group',
          title: 'Flow surface admin-only route group',
          icon: 'AppstoreOutlined',
        },
      }),
    );

    const created = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          version: '1',
          mode: 'create',
          navigation: {
            layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
            group: {
              routeId: adminGroup.routeId,
            },
            item: {
              title: 'Flow surface ignored group route page',
              icon: 'FileOutlined',
            },
          },
          page: {
            title: 'Flow surface ignored group route page',
          },
          tabs: [
            {
              title: 'Overview',
              blocks: [
                {
                  type: 'markdown',
                  settings: {
                    content: 'This page should be created at the mobile root',
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const pageRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: created.surface.pageRoute.id,
    });
    expect(isRootRoute(pageRoute)).toBe(true);
    expect(await readRouteLayoutUids(app, created.surface.pageRoute.id)).toEqual([DEFAULT_MOBILE_UI_LAYOUT_UID]);
  });

  it('should reject explicit navigation group route ids outside a non-mobile requested layout', async () => {
    const mobileGroup = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          layoutUid: DEFAULT_MOBILE_UI_LAYOUT_UID,
          type: 'group',
          title: 'Flow surface mobile-only route group',
          icon: 'AppstoreOutlined',
        },
      }),
    );

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          layoutUid: DEFAULT_ADMIN_UI_LAYOUT_UID,
          group: {
            routeId: mobileGroup.routeId,
          },
          item: {
            title: 'Flow surface non-mobile mismatch page',
            icon: 'FileOutlined',
          },
        },
        page: {
          title: 'Flow surface non-mobile mismatch page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'markdown',
                settings: {
                  content: 'This page should not be created',
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(400);
    expect(response.body?.errors?.[0]?.ruleId).toBe('navigation-route-layout-mismatch');
  });

  it('should reject disabled layoutUid before duplicate page identity can become replace', async () => {
    await app.db.getRepository('uiLayouts').create({
      values: {
        uid: DISABLED_UI_LAYOUT_UID,
        title: 'Flow surface disabled layout',
        layoutType: 'mobile',
        routeName: 'flow-surface-disabled-layout',
        routePath: '/flow-surface-disabled-layout',
        authCheck: true,
        enabled: true,
      },
    });

    await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          layoutUid: DISABLED_UI_LAYOUT_UID,
          group: {
            title: 'Flow surface disabled layout group',
            icon: 'AppstoreOutlined',
          },
          item: {
            title: 'Flow surface disabled layout page',
            icon: 'FileOutlined',
          },
        },
        page: {
          title: 'Flow surface disabled layout page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'markdown',
                settings: {
                  content: 'Disabled layout page content',
                },
              },
            ],
          },
        ],
      },
    });

    await app.db.getRepository('uiLayouts').update({
      filterByTk: DISABLED_UI_LAYOUT_UID,
      values: {
        enabled: false,
      },
    });

    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          layoutUid: DISABLED_UI_LAYOUT_UID,
          group: {
            title: 'Flow surface disabled layout group',
          },
          item: {
            title: 'Flow surface disabled layout page',
            icon: 'FileOutlined',
          },
        },
        page: {
          title: 'Flow surface disabled layout page',
        },
        tabs: [
          {
            title: 'Overview',
            blocks: [
              {
                type: 'markdown',
                settings: {
                  content: 'This page should not replace the disabled layout page',
                },
              },
            ],
          },
        ],
      },
    });

    expect(response.status, readErrorMessage(response)).toBe(400);
    expect(response.body?.errors?.[0]?.ruleId).toBe('navigation-layout-not-found');
  });
});
