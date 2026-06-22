/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test';
import { getData } from './flow-surfaces.contract.helpers';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const DEFAULT_ADMIN_UI_LAYOUT_UID = 'admin-layout-model';

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
});
