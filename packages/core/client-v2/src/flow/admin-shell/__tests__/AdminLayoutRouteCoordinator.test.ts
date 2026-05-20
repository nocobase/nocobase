/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getViewDiffAndUpdateHidden } from '../../getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../../flows/openViewFlow';
import { resolveViewParamsToViewList } from '../../resolveViewParamsToViewList';
import { AdminLayoutRouteCoordinator } from '../AdminLayoutRouteCoordinator';
import { BaseLayoutRouteCoordinator, toViewStack } from '../BaseLayoutRouteCoordinator';
import { RouteModel } from '../../models/base/RouteModel';

vi.mock('../../resolveViewParamsToViewList', () => ({
  resolveViewParamsToViewList: vi.fn(),
  updateViewListHidden: vi.fn(),
}));

vi.mock('../../getViewDiffAndUpdateHidden', () => ({
  getViewDiffAndUpdateHidden: vi.fn(),
  getKey: vi.fn((viewItem) => viewItem.params.viewUid),
}));

vi.mock('../../flows/openViewFlow', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getOpenViewStepParams: vi.fn(),
  };
});

const mockResolveViewParamsToViewList = vi.mocked(resolveViewParamsToViewList);
const mockGetViewDiffAndUpdateHidden = vi.mocked(getViewDiffAndUpdateHidden);
const mockGetOpenViewStepParams = vi.mocked(getOpenViewStepParams);

function setupRouteReplay(viewParams: Record<string, any>) {
  const engine = new FlowEngine();
  engine.registerModels({ RouteModel });
  engine.context.defineProperty('route', {
    value: {
      params: { name: 'test-route' },
      pathname: '/admin/popup/filterbytk/member',
    },
  });
  engine.context.defineProperty('routeRepository', {
    value: {
      getRouteBySchemaUid: vi.fn(() => ({})),
    },
  });

  const dispatchEvent = vi.fn((_eventName: string, _payload: any) => Promise.resolve());
  const viewItem = {
    params: {
      viewUid: 'popup',
      filterByTk: 'member',
      ...viewParams,
    },
    modelUid: 'popup',
    model: { uid: 'popup', dispatchEvent } as any,
    hidden: { value: false },
    index: 0,
  };

  mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
  mockGetViewDiffAndUpdateHidden.mockReturnValue({
    viewsToClose: [],
    viewsToOpen: [viewItem],
  });
  mockGetOpenViewStepParams.mockReturnValue({
    collectionName: 'roles',
    associationName: 'users.roles',
    dataSourceKey: 'main',
  } as any);

  const coordinator = new AdminLayoutRouteCoordinator(engine);
  coordinator.registerPage('test-route', {
    active: true,
    layoutContentElement: document.createElement('div'),
  });

  return { dispatchEvent };
}

describe('AdminLayoutRouteCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drops configured associationName during route replay when sourceId is absent', () => {
    const { dispatchEvent } = setupRouteReplay({});

    expect(dispatchEvent.mock.calls[0][1]).toMatchObject({
      collectionName: 'roles',
      associationName: null,
      dataSourceKey: 'main',
      filterByTk: 'member',
      triggerByRouter: true,
    });
  });

  it('keeps configured associationName during route replay when sourceId is present', () => {
    const { dispatchEvent } = setupRouteReplay({ sourceId: '1' });

    expect(dispatchEvent.mock.calls[0][1]).toMatchObject({
      collectionName: 'roles',
      associationName: 'users.roles',
      dataSourceKey: 'main',
      filterByTk: 'member',
      sourceId: '1',
      triggerByRouter: true,
    });
  });

  it('parses view stack with custom layout prefix', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-route' },
        pathname: '/embed/test-route/view/popup/filterbytk/member',
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    mockResolveViewParamsToViewList.mockReturnValue([]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePath: '/embed' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(mockResolveViewParamsToViewList).toHaveBeenCalledWith(
      engine,
      [{ viewUid: 'test-route' }, { viewUid: 'popup', filterByTk: 'member' }],
      expect.anything(),
    );
  });

  it('syncs view stack from layout route pageUid', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('route', {
      value: {},
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    mockResolveViewParamsToViewList.mockReturnValue([]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePath: '/embed' });
    coordinator.registerPage('test-route', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/embed/test-route/view/popup/filterbytk/member',
    });

    expect(mockResolveViewParamsToViewList).toHaveBeenLastCalledWith(
      engine,
      [{ viewUid: 'test-route' }, { viewUid: 'popup', filterByTk: 'member' }],
      expect.anything(),
    );
  });

  it('parses view stack with nested basePath', () => {
    expect(
      toViewStack('/admin/settings/public-forms/form-1/view/popup', { basePath: '/admin/settings/public-forms' }),
    ).toEqual([{ viewUid: 'form-1' }, { viewUid: 'popup' }]);
  });

  it('exposes current layout on route model context', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-route' },
        pathname: '/embed/test-route',
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    mockResolveViewParamsToViewList.mockReturnValue([]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const layout = {
      name: 'embed',
      basePath: '/embed',
      normalizedBasePath: 'embed',
      uid: 'embed-layout-model',
      layoutModelClass: 'EmbedLayoutModelV2',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    const coordinator = new BaseLayoutRouteCoordinator(engine, { layout });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(engine.getModel('test-route')?.context.layout).toBe(layout);
  });
});
