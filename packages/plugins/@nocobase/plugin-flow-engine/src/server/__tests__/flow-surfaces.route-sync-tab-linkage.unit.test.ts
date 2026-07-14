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

describe('FlowSurfaceRouteSync tab linkage preservation', () => {
  it('should preserve tab linkage rules and the route marker while updating flowRegistry', async () => {
    const linkageRules = {
      value: [
        {
          key: 'tab-rule',
          title: 'Keep linkage rules',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [],
        },
      ],
    };
    const routeValues = {
      id: 10,
      schemaUid: 'tab-1',
      title: 'Tab title',
      options: {
        badge: 'new',
        hasPersistedPageTabLinkageRules: true,
        flowRegistry: {
          oldFlow: { key: 'oldFlow', on: 'beforeRender', steps: {} },
        },
      },
    };
    const route = {
      get: (key: keyof typeof routeValues) => routeValues[key],
      toJSON: () => routeValues,
    };
    const anchor = {
      uid: 'tab-1',
      use: 'RootPageTabModel',
      props: { anchorProp: true },
      stepParams: {
        pageTabSettings: {
          tab: { title: 'Anchor title' },
          linkageRules,
        },
      },
      flowRegistry: routeValues.options.flowRegistry,
      subModels: {
        grid: { uid: 'grid-1', use: 'BlockGridModel' },
      },
    };
    const desktopRoutes = {
      findOne: vi.fn().mockResolvedValue(route),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const db = {
      getRepository: vi.fn(() => desktopRoutes),
    };
    const repository = {
      findModelById: vi.fn().mockResolvedValue(anchor),
      findModelByParentId: vi.fn().mockResolvedValue(anchor.subModels.grid),
      patch: vi.fn(),
    };
    const patchModel = vi.fn().mockResolvedValue(undefined);
    const routeSync = new FlowSurfaceRouteSync(db as never, repository as never, patchModel);
    const nextFlowRegistry = {
      tabBeforeRender: {
        key: 'tabBeforeRender',
        on: 'beforeRender',
        steps: {},
      },
    };

    await routeSync.persistTabSettings({ uid: 'tab-1', tabRoute: route }, anchor, {
      uid: 'tab-1',
      flowRegistry: nextFlowRegistry,
    });

    expect(desktopRoutes.update).toHaveBeenCalledWith({
      filterByTk: '10',
      values: {
        options: {
          badge: 'new',
          hasPersistedPageTabLinkageRules: true,
          flowRegistry: nextFlowRegistry,
        },
      },
      transaction: undefined,
    });
    expect(patchModel).toHaveBeenCalledTimes(1);
    expect(patchModel.mock.calls[0][0]).toMatchObject({
      uid: 'tab-1',
      stepParams: {
        pageTabSettings: {
          linkageRules,
        },
      },
      flowRegistry: nextFlowRegistry,
    });
  });
});
