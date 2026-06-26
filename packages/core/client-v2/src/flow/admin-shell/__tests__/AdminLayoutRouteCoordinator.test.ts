/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getViewDiffAndUpdateHidden } from '../../getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../../flows/openViewFlow';
import { resolveViewParamsToViewList, updateViewListHidden } from '../../resolveViewParamsToViewList';
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
const mockUpdateViewListHidden = vi.mocked(updateViewListHidden);

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
  coordinator.syncRoute({
    params: { name: 'test-route' },
    pathname: '/admin/popup/filterbytk/member',
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

  it('passes RunJS openView route state as runtime mode and size during route replay', () => {
    const { dispatchEvent } = setupRouteReplay({
      openViewRouteState: { mode: 'dialog', size: 'large' },
    });

    expect(dispatchEvent.mock.calls[0][1]).toMatchObject({
      mode: 'dialog',
      size: 'large',
      openViewRouteState: { mode: 'dialog', size: 'large' },
      triggerByRouter: true,
    });
  });

  it('uses layout content element before route page placeholder as view target', () => {
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

    const layoutContentElement = document.createElement('div');
    const routePageElement = document.createElement('div');
    const dispatchEvent = vi.fn((_eventName: string, _payload: any) => Promise.resolve());
    const viewItem = {
      params: { viewUid: 'test-route' },
      modelUid: 'test-route',
      model: { uid: 'test-route', dispatchEvent } as any,
      hidden: { value: false },
      index: 0,
    };
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetOpenViewStepParams.mockReturnValue({} as any);

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(layoutContentElement);
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: routePageElement,
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(dispatchEvent.mock.calls[0][1].target).toBe(layoutContentElement);
  });

  it('replaces stale non-route model before registering route page', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const staleModel = engine.createModel({
      uid: 'test-route',
      use: 'FlowModel',
    });
    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });

    const routeModel = coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(routeModel).toBeInstanceOf(RouteModel);
    expect(engine.getModel('test-route')).toBe(routeModel);
    expect(engine.getModel('test-route')).not.toBe(staleModel);
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

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/embed' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      params: { name: 'test-route' },
      pathname: '/embed/test-route/view/popup/filterbytk/member',
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

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/embed' });
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

  it('notifies cached route page activation when switching pages', () => {
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

    const dispatchEvent = vi.fn((_eventName: string, payload: any) => {
      payload.activateRef.current = vi.fn();
      payload.deactivateRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = {
      params: { viewUid: 'test-route' },
      modelUid: 'test-route',
      model: { uid: 'test-route', dispatchEvent } as any,
      hidden: { value: false },
      index: 0,
    };
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValueOnce({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    const payload = dispatchEvent.mock.calls[0][1];
    expect(payload.pageActive).toBe(true);
    expect(payload.activationControlledByLayout).toBe(true);

    coordinator.syncRoute({
      pageUid: 'other-route',
      pathname: '/admin/other-route',
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(payload.deactivateRef.current).toHaveBeenCalledTimes(1);
    expect(payload.activateRef.current).toHaveBeenCalledWith(true);
  });

  it('syncs cached embed page visibility when switching pages', () => {
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

    const viewItemsByPageUid = new Map<string, any>();
    const createViewItem = (pageUid: string) => {
      const dispatchEvent = vi.fn((_eventName: string, payload: any) => {
        payload.activateRef.current = vi.fn();
        payload.deactivateRef.current = vi.fn();
        return Promise.resolve();
      });
      return {
        params: { viewUid: pageUid },
        modelUid: pageUid,
        model: { uid: pageUid, dispatchEvent } as any,
        hidden: { value: false },
        index: 0,
      };
    };

    mockResolveViewParamsToViewList.mockImplementation((_engine, viewParams) => {
      const pageUid = viewParams[0].viewUid;
      if (!viewItemsByPageUid.has(pageUid)) {
        viewItemsByPageUid.set(pageUid, createViewItem(pageUid));
      }
      return [viewItemsByPageUid.get(pageUid)];
    });
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockUpdateViewListHidden.mockImplementation((viewItems) => {
      viewItems.forEach((viewItem) => {
        viewItem.hidden.value = false;
      });
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('page-1', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.registerPage('page-3', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });

    coordinator.syncRoute({
      pageUid: 'page-3',
      pathname: '/admin/page-3',
    });
    const page3ViewItem = viewItemsByPageUid.get('page-3');
    expect(page3ViewItem.hidden.value).toBe(false);

    coordinator.syncRoute({
      pageUid: 'page-1',
      pathname: '/admin/page-1',
    });
    const page1ViewItem = viewItemsByPageUid.get('page-1');
    expect(page1ViewItem.hidden.value).toBe(false);
    expect(page3ViewItem.hidden.value).toBe(true);

    coordinator.syncRoute({
      pageUid: 'page-3',
      pathname: '/admin/page-3',
    });
    expect(page3ViewItem.hidden.value).toBe(false);
    expect(page1ViewItem.hidden.value).toBe(true);
  });

  it('notifies cached route page activation when page meta active changes', () => {
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

    const dispatchEvent = vi.fn((_eventName: string, payload: any) => {
      payload.activateRef.current = vi.fn();
      payload.deactivateRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = {
      params: { viewUid: 'test-route' },
      modelUid: 'test-route',
      model: { uid: 'test-route', dispatchEvent } as any,
      hidden: { value: false },
      index: 0,
    };
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValueOnce({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    const payload = dispatchEvent.mock.calls[0][1];

    coordinator.syncPageMeta('test-route', { active: false });
    coordinator.syncPageMeta('test-route', { active: true });

    expect(payload.deactivateRef.current).toHaveBeenCalledTimes(1);
    expect(payload.activateRef.current).toHaveBeenCalledWith(true);
  });

  it('replays an initial deep link when step navigation does not trigger another route sync', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const navigate = vi.fn();
    engine.context.defineProperty('router', {
      value: {
        navigate,
      },
    });
    engine.context.defineProperty('route', {
      value: {},
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    const popupViewItem = {
      params: { viewUid: 'popup', filterByTk: '1' },
      modelUid: 'popup',
      model: { uid: 'popup', dispatchEvent: vi.fn() } as any,
      hidden: { value: false },
      index: 1,
    };
    mockResolveViewParamsToViewList.mockImplementation((_engine, viewParams, routeModel) => [
      {
        params: viewParams[0],
        modelUid: routeModel.uid,
        model: routeModel,
        hidden: { value: false },
        index: 0,
      },
      popupViewItem,
    ]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup/filterbytk/1',
    });

    expect(navigate).toHaveBeenCalledWith('/admin/test-route', { replace: true });
    expect(mockGetViewDiffAndUpdateHidden).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(mockResolveViewParamsToViewList).toHaveBeenCalledTimes(2);
    expect(mockGetViewDiffAndUpdateHidden).toHaveBeenCalledTimes(1);
  });

  it('does not replay global route when a route page registers', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'test-route' },
        pathname: '/embed/test-route/view/popup',
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

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/embed' });
    coordinator.registerPage('test-route', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });

    expect(mockResolveViewParamsToViewList).not.toHaveBeenCalled();
    expect(engine.getModel('test-route')?.context.pageActive.value).toBe(false);
  });

  it('parses view stack with nested basePath', () => {
    expect(
      toViewStack('/admin/settings/public-forms/form-1/view/popup', {
        basePathname: '/admin/settings/public-forms',
      }),
    ).toEqual([{ viewUid: 'form-1' }, { viewUid: 'popup' }]);
  });

  it('parses view stack for empty nested routePath from runtime basePathname', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('route', {
      value: {
        params: { name: 'form-1' },
        pathname: '/admin/settings/public-forms/form-1/view/popup/filterbytk/member',
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

    const coordinator = new BaseLayoutRouteCoordinator(engine, {
      layout: {
        routeName: 'admin.settings.publicForms.layout',
        routePath: '',
        rootRouteName: 'admin',
        uid: 'public-form-layout-model',
        layoutModelClass: 'PublicFormLayoutModel',
        rootPageModelClass: 'RootPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: true,
      },
    });
    coordinator.registerPage('form-1', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      layoutRouteName: 'admin.settings.publicForms.layout',
      params: { name: 'form-1' },
      pathname: '/admin/settings/public-forms/form-1/view/popup/filterbytk/member',
      layoutBasePathname: '/admin/settings/public-forms',
    });

    expect(mockResolveViewParamsToViewList).toHaveBeenCalledWith(
      engine,
      [{ viewUid: 'form-1' }, { viewUid: 'popup', filterByTk: 'member' }],
      expect.anything(),
    );
  });

  it('does not parse relative layout routePath without runtime basePathname', () => {
    expect(
      toViewStack('/admin/settings/public-forms/form-1/view/popup', {
        layout: {
          routeName: 'admin.settings.publicForms',
          routePath: 'public-forms',
          rootRouteName: 'admin',
          uid: 'public-form-layout-model',
          layoutModelClass: 'PublicFormLayoutModel',
          rootPageModelClass: 'RootPageModel',
          childPageModelClass: 'ChildPageModel',
          authCheck: true,
        },
      }),
    ).toEqual([]);
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
      routeName: 'embed',
      routePath: '/embed',
      rootRouteName: 'embed',
      uid: 'embed-layout-model',
      layoutModelClass: 'EmbedLayoutModelV2',
      rootPageModelClass: 'RootPageModel',
      childPageModelClass: 'ChildPageModel',
      authCheck: true,
    };
    const layoutContext = new FlowContext();
    layoutContext.defineProperty('layoutMarker', { value: 'layout-context' });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { layout, layoutContext });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });

    expect(engine.getModel('test-route')?.context.layout).toBe(layout);
    expect(engine.getModel('test-route')?.context.layoutContext).toBe(layoutContext);
    expect(engine.getModel('test-route')?.context.layoutMarker).toBe('layout-context');
  });
});
