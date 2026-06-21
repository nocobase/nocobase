/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  createFlowSurfacesContractContext,
  createMenu,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const CUSTOM_LAYOUT_UID = 'flow-surfaces-custom-layout';
const UI_LAYOUT_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'ui-layout'] as const;
const UI_LAYOUT_TEST_PLUGIN_INSTALLS = [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, 'ui-layout'] as const;

type RouteLike = {
  id?: unknown;
  children?: unknown;
};

type UiLayoutLike = {
  uid?: unknown;
  get?: (field: string) => unknown;
};

async function getRouteUiLayoutUids(context: FlowSurfacesContractContext, routeId: string | number) {
  const route = await context.db.getRepository('desktopRoutes').findOne({
    filterByTk: String(routeId),
    appends: ['uiLayouts'],
  });
  return _.sortBy(
    _.castArray(route?.get('uiLayouts'))
      .map((uiLayout: UiLayoutLike) => uiLayout?.get?.('uid') ?? uiLayout?.uid)
      .filter((uid): uid is string => typeof uid === 'string' && !!uid),
  );
}

async function expectRouteUiLayouts(
  context: FlowSurfacesContractContext,
  routeIds: Array<string | number>,
  expectedUids: string[],
) {
  for (const routeId of routeIds) {
    expect(await getRouteUiLayoutUids(context, routeId)).toEqual(_.sortBy(expectedUids));
  }
}

async function setRouteUiLayouts(
  context: FlowSurfacesContractContext,
  routeId: string | number,
  uiLayoutUids: string[],
) {
  await context.db.getRepository('desktopRoutes.uiLayouts', routeId).set({
    tk: uiLayoutUids,
  });
}

function collectRouteIds(routes: unknown[]): string[] {
  return _.castArray(routes).flatMap((route) => {
    const item = route as RouteLike;
    return [String(item?.id), ...collectRouteIds(_.castArray(item?.children || []))];
  });
}

async function listAccessibleRouteIds(context: FlowSurfacesContractContext, layoutUid = ADMIN_LAYOUT_UID) {
  const response = await context.rootAgent.get('/desktopRoutes:listAccessible').query({
    layout: layoutUid,
    tree: true,
    sort: 'sort',
  });
  expect(response.status).toBe(200);
  return collectRouteIds(response.body?.data || []).filter((id) => id && id !== 'undefined');
}

describe('flowSurfaces ui-layout route ownership contract', () => {
  let context: FlowSurfacesContractContext;

  beforeEach(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: UI_LAYOUT_TEST_PLUGINS,
      plugins: UI_LAYOUT_TEST_PLUGIN_INSTALLS,
    });
  });

  afterEach(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should assign createPage page and hidden tab routes to the admin layout and keep them accessible', async () => {
    const page = await createPage(context.rootAgent, {
      title: 'UI layout page',
      tabTitle: 'Overview',
    });

    await expectRouteUiLayouts(context, [page.routeId, page.tabRouteId], [ADMIN_LAYOUT_UID]);

    const routeIds = await listAccessibleRouteIds(context);
    expect(routeIds).toEqual(expect.arrayContaining([String(page.routeId)]));
  });

  it('should backfill admin layout ownership when createPage initializes a bindable route without layouts', async () => {
    const menu = await createMenu(context.rootAgent, {
      type: 'item',
      title: 'Legacy bindable menu',
    });
    await setRouteUiLayouts(context, menu.routeId, []);
    await setRouteUiLayouts(context, menu.tabRouteId, []);
    await expectRouteUiLayouts(context, [menu.routeId, menu.tabRouteId], []);

    const page = await createPage(context.rootAgent, {
      menuRouteId: menu.routeId,
      title: 'Initialized legacy bindable menu',
      tabTitle: 'Main',
    });

    expect(page.routeId).toBe(menu.routeId);
    await expectRouteUiLayouts(context, [page.routeId, page.tabRouteId], [ADMIN_LAYOUT_UID]);

    const routeIds = await listAccessibleRouteIds(context);
    expect(routeIds).toEqual(expect.arrayContaining([String(page.routeId)]));
  });

  it('should assign createMenu routes by default and inherit parent layouts for child routes and tabs', async () => {
    await context.db.getRepository('uiLayouts').create({
      values: {
        uid: CUSTOM_LAYOUT_UID,
        title: 'Flow surfaces custom layout',
        layoutType: 'desktop',
        routeName: 'flow-surfaces-custom',
        routePath: '/flow-surfaces-custom',
        authCheck: true,
        enabled: true,
      },
    });

    const rootItem = await createMenu(context.rootAgent, {
      type: 'item',
      title: 'Root layout item',
    });
    await expectRouteUiLayouts(context, [rootItem.routeId, rootItem.tabRouteId], [ADMIN_LAYOUT_UID]);

    const group = await createMenu(context.rootAgent, {
      type: 'group',
      title: 'Custom layout group',
    });
    await expectRouteUiLayouts(context, [group.routeId], [ADMIN_LAYOUT_UID]);
    await setRouteUiLayouts(context, group.routeId, [CUSTOM_LAYOUT_UID]);

    const item = await createMenu(context.rootAgent, {
      type: 'item',
      title: 'Custom layout item',
      parentMenuRouteId: group.routeId,
    });
    await expectRouteUiLayouts(context, [item.routeId, item.tabRouteId], [CUSTOM_LAYOUT_UID]);

    const page = await createPage(context.rootAgent, {
      menuRouteId: item.routeId,
      title: 'Custom layout page',
      enableTabs: true,
    });
    const addedTab = getData(
      await context.rootAgent.resource('flowSurfaces').addTab({
        values: {
          target: {
            uid: page.pageUid,
          },
          title: 'Details',
        },
      }),
    );

    await expectRouteUiLayouts(context, [page.routeId, page.tabRouteId, addedTab.tabRouteId], [CUSTOM_LAYOUT_UID]);
  });
});
