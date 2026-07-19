/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowEngine, type FlowModel } from '@nocobase/flow-engine';
import type React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getViewDiffAndUpdateHidden } from '../../getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from '../../flows/openViewFlow';
import { resolveViewParamsToViewList, updateViewListHidden, type ViewItem } from '../../resolveViewParamsToViewList';
import { AdminLayoutRouteCoordinator } from '../AdminLayoutRouteCoordinator';
import { BaseLayoutRouteCoordinator, toViewStack } from '../BaseLayoutRouteCoordinator';
import { RouteModel } from '../../models/base/RouteModel';
import { ROUTE_TRANSIENT_INPUT_ARGS_KEY } from '../../routeTransientInputArgs';

vi.mock('../../resolveViewParamsToViewList', () => ({
  resolveViewParamsToViewList: vi.fn(),
  updateViewListHidden: vi.fn(),
}));

vi.mock('../../getViewDiffAndUpdateHidden', () => ({
  getViewDiffAndUpdateHidden: vi.fn(),
  getKey: vi.fn((viewItem) => viewItem.params.viewUid),
}));

vi.mock('../../flows/openViewFlow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../flows/openViewFlow')>();
  return {
    ...actual,
    getOpenViewStepParams: vi.fn(),
  };
});

const mockResolveViewParamsToViewList = vi.mocked(resolveViewParamsToViewList);
const mockGetViewDiffAndUpdateHidden = vi.mocked(getViewDiffAndUpdateHidden);
const mockGetOpenViewStepParams = vi.mocked(getOpenViewStepParams);
const mockUpdateViewListHidden = vi.mocked(updateViewListHidden);

type RouteOpenPayload = {
  target?: HTMLElement | null;
  destroyRef: React.RefObject<(result?: unknown, force?: boolean) => void>;
  updateRef: React.RefObject<(value: unknown) => void>;
  activateRef: React.RefObject<(forceRefresh?: boolean) => void>;
  deactivateRef: React.RefObject<() => void>;
  onOpen: () => void;
  pageActive: boolean;
  activationControlledByLayout: boolean;
  hidden: { value: boolean };
  triggerByRouter: boolean;
  [key: string]: unknown;
};

type DispatchEventMock = ReturnType<typeof createDispatchEventMock>;

const createDispatchEventMock = (
  implementation?: (eventName: string, payload: RouteOpenPayload) => Promise<unknown[] | void>,
) => vi.fn((eventName: string, payload: RouteOpenPayload) => implementation?.(eventName, payload) ?? Promise.resolve());

const createViewModel = (uid: string, dispatchEvent: DispatchEventMock) =>
  ({
    uid,
    dispatchEvent,
  }) as unknown as FlowModel;

const createViewItem = (
  uid: string,
  dispatchEvent: DispatchEventMock,
  index = 0,
  params: ViewItem['params'] = { viewUid: uid },
): ViewItem => ({
  params,
  modelUid: uid,
  model: createViewModel(uid, dispatchEvent),
  hidden: { value: false },
  index,
});

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

function setupRouteReplay(viewParams: Record<string, unknown>) {
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

  const dispatchEvent = createDispatchEventMock();
  const viewItem = createViewItem('popup', dispatchEvent, 0, {
    viewUid: 'popup',
    filterByTk: 'member',
    ...viewParams,
  });

  mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
  mockGetViewDiffAndUpdateHidden.mockReturnValue({
    viewsToClose: [],
    viewsToOpen: [viewItem],
  });
  mockGetOpenViewStepParams.mockReturnValue({
    collectionName: 'roles',
    associationName: 'users.roles',
    dataSourceKey: 'main',
  });

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
    const dispatchEvent = createDispatchEventMock();
    const viewItem = createViewItem('test-route', dispatchEvent);
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

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

  it('passes transient route state input args to the opened view', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    const dispatchEvent = createDispatchEventMock();
    const viewItem = createViewItem('test-route', dispatchEvent);
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
      state: {
        usr: {
          [ROUTE_TRANSIENT_INPUT_ARGS_KEY]: {
            'test-route': {
              formData: {
                start: '2026-06-24 08:00:00',
                end: '2026-06-24 09:00:00',
              },
            },
          },
        },
      },
    });

    expect(dispatchEvent.mock.calls[0][1]).toMatchObject({
      formData: {
        start: '2026-06-24 08:00:00',
        end: '2026-06-24 09:00:00',
      },
    });
  });

  it('keeps transient route state input args during initial deep-link replay', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const navigate = vi.fn();
    engine.context.defineProperty('router', {
      value: {
        navigate,
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.onOpen?.();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock();
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem = createViewItem('popup', popupDispatchEvent, 1);

    mockResolveViewParamsToViewList.mockReturnValue([rootViewItem, popupViewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [rootViewItem, popupViewItem],
    });
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const routeState = {
      [ROUTE_TRANSIENT_INPUT_ARGS_KEY]: {
        popup: {
          formData: {
            start: '2026-06-24',
            end: '2026-06-25',
          },
        },
      },
    };
    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
      state: routeState,
    });

    expect(navigate).toHaveBeenCalledWith('/admin/test-route', { replace: true, state: routeState });
    expect(navigate).toHaveBeenCalledWith('/admin/test-route/view/popup', { state: routeState });
    expect(popupDispatchEvent).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(popupDispatchEvent.mock.calls[0][1]).toMatchObject({
      formData: {
        start: '2026-06-24',
        end: '2026-06-25',
      },
    });
  });

  it('preserves child view extension segments during initial deep-link step navigation', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    const navigate = vi.fn();
    engine.context.defineProperty('router', {
      value: {
        navigate,
      },
    });
    engine.context.defineProperty('routeRepository', {
      value: {
        getRouteBySchemaUid: vi.fn(() => ({})),
      },
    });

    const rootDispatchEvent = createDispatchEventMock();
    const taskDispatchEvent = createDispatchEventMock();
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const taskViewItem = createViewItem('workflow-tasks', taskDispatchEvent, 1);

    mockResolveViewParamsToViewList.mockReturnValue([rootViewItem, taskViewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [rootViewItem, taskViewItem],
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/workflow-tasks/tasktype/approval-apply/status/completed',
    });

    expect(navigate).toHaveBeenCalledWith('/admin/test-route', { replace: true });
    expect(navigate).toHaveBeenCalledWith(
      '/admin/test-route/view/workflow-tasks/tasktype/approval-apply/status/completed',
      undefined,
    );
  });

  it('replays the active route view when the layout content element changes', () => {
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

    const firstDestroy = vi.fn();
    const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
      if (dispatchEvent.mock.calls.length === 1) {
        payload.destroyRef.current = firstDestroy;
      }
      return Promise.resolve();
    });
    const viewItem = createViewItem('test-route', dispatchEvent);
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockReturnValue({
      viewsToClose: [],
      viewsToOpen: [viewItem],
    });
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const firstLayoutContentElement = document.createElement('div');
    const secondLayoutContentElement = document.createElement('div');
    const routePageElement = document.createElement('div');

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(firstLayoutContentElement);
    const routeModel = coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: routePageElement,
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][1].target).toBe(firstLayoutContentElement);

    coordinator.setLayoutContentElement(null);
    expect(dispatchEvent).toHaveBeenCalledTimes(1);

    coordinator.setLayoutContentElement(secondLayoutContentElement);

    expect(firstDestroy).toHaveBeenCalledTimes(1);
    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[1][1].target).toBe(secondLayoutContentElement);
    expect(engine.getModel('test-route')).toBe(routeModel);
  });

  it('reopens an inactive cached route view on the new layout content element when it becomes active again', () => {
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

    const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      payload.activateRef.current = vi.fn();
      payload.deactivateRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = createViewItem('test-route', dispatchEvent);
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const firstLayoutContentElement = document.createElement('div');
    const secondLayoutContentElement = document.createElement('div');
    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(firstLayoutContentElement);
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    coordinator.syncRoute({
      pageUid: 'other-route',
      pathname: '/admin/other-route',
    });
    coordinator.setLayoutContentElement(secondLayoutContentElement);
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[1][1].target).toBe(secondLayoutContentElement);
  });

  it('ignores stale view onOpen callbacks after the layout content element changes', () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    let stalePopupOnOpen: (() => void) | undefined;
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      stalePopupOnOpen = payload.onOpen;
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const detailDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem = createViewItem('popup', popupDispatchEvent, 1);
    const detailViewItem = createViewItem('detail', detailDispatchEvent, 2);
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem, detailViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(popupDispatchEvent).toHaveBeenCalledTimes(1);
    expect(detailDispatchEvent).not.toHaveBeenCalled();
    expect(stalePopupOnOpen).toBeDefined();

    resolvedViewList = [rootViewItem];
    coordinator.setLayoutContentElement(document.createElement('div'));
    stalePopupOnOpen?.();

    expect(detailDispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores stale async model loads after the layout content element changes', async () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    let resolvePopupModel: (model: FlowModel) => void = () => {};
    vi.spyOn(engine, 'loadModel').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePopupModel = resolve;
        }),
    );
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem];
    coordinator.setLayoutContentElement(document.createElement('div'));
    resolvePopupModel(createViewModel('popup', popupDispatchEvent));
    await nextTick();

    expect(popupDispatchEvent.mock.calls.length).toBe(0);
  });

  it('ignores stale async view opens after the pathname changes', async () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    const resolvePopupModels: Array<(model: FlowModel) => void> = [];
    vi.spyOn(engine, 'loadModel').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePopupModels.push(resolve);
        }),
    );
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    resolvedViewList = [rootViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });
    resolvePopupModels.forEach((resolvePopupModel) => {
      resolvePopupModel(createViewModel('popup', popupDispatchEvent));
    });
    await nextTick();

    expect(popupDispatchEvent.mock.calls.length).toBe(0);
  });

  it('does not duplicate pending async view opens when the same pathname syncs again', async () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    const resolvePopupModels: Array<(model: FlowModel) => void> = [];
    vi.spyOn(engine, 'loadModel').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePopupModels.push(resolve);
        }),
    );
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    resolvePopupModels.forEach((resolvePopupModel) => {
      resolvePopupModel(createViewModel('popup', popupDispatchEvent));
    });
    await nextTick();

    expect(popupDispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('clears pending route view opens when dispatchEvent throws synchronously', async () => {
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

    const dispatchError = new Error('open failed');
    const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
      if (dispatchEvent.mock.calls.length === 1) {
        throw dispatchError;
      }

      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = createViewItem('test-route', dispatchEvent);
    mockResolveViewParamsToViewList.mockReturnValue([viewItem]);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });
    await nextTick();

    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });

  it('ignores stale initial deep-link replay after the pathname changes before a view opens', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ RouteModel });
    engine.context.defineProperty('router', {
      value: {
        navigate: vi.fn(),
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      payload.onOpen();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem = createViewItem('popup', popupDispatchEvent, 1);
    mockResolveViewParamsToViewList.mockImplementation((_engine, viewParams) => {
      if (viewParams[1]?.viewUid === 'popup') {
        return [rootViewItem, popupViewItem];
      }
      return [];
    });
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });
    await nextTick();

    expect(popupDispatchEvent.mock.calls.length).toBe(0);
  });

  it('ignores stale async view opens after the route is cleared', async () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    let resolvePopupModel: (model: FlowModel) => void = () => {};
    vi.spyOn(engine, 'loadModel').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePopupModel = resolve;
        }),
    );
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    coordinator.syncRoute({});
    resolvePopupModel(createViewModel('popup', popupDispatchEvent));
    await nextTick();

    expect(popupDispatchEvent).not.toHaveBeenCalled();
  });

  it('ignores stale async view opens after switching away and back to the same pathname', async () => {
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

    const pageRootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const otherRootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const stalePopupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const currentPopupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const pageRootViewItem = createViewItem('test-route', pageRootDispatchEvent);
    const otherRootViewItem = createViewItem('other-route', otherRootDispatchEvent);
    const firstPopupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    const secondPopupViewItem: ViewItem = {
      params: { viewUid: 'popup' },
      modelUid: 'popup',
      model: undefined,
      hidden: { value: false },
      index: 1,
    };
    const resolvePopupModels: Array<(model: FlowModel) => void> = [];
    vi.spyOn(engine, 'loadModel').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePopupModels.push(resolve);
        }),
    );
    let resolvedViewList: ViewItem[] = [pageRootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.registerPage('other-route', {
      active: false,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [pageRootViewItem, firstPopupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    resolvedViewList = [otherRootViewItem];
    coordinator.syncRoute({
      pageUid: 'other-route',
      pathname: '/admin/other-route',
    });

    resolvedViewList = [pageRootViewItem, secondPopupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });

    resolvePopupModels[0]?.(createViewModel('popup', stalePopupDispatchEvent));
    resolvePopupModels[1]?.(createViewModel('popup', currentPopupDispatchEvent));
    await nextTick();

    expect(stalePopupDispatchEvent).not.toHaveBeenCalled();
    expect(currentPopupDispatchEvent).toHaveBeenCalledTimes(1);
  });

  it('does not run initial deep-link step navigation while replaying after layout content element changes', () => {
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

    const rootDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      payload.onOpen();
      return Promise.resolve();
    });
    const popupDispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.destroyRef.current = vi.fn();
      return Promise.resolve();
    });
    const rootViewItem = createViewItem('test-route', rootDispatchEvent);
    const popupViewItem = createViewItem('popup', popupDispatchEvent, 1);
    let resolvedViewList: ViewItem[] = [rootViewItem];
    mockResolveViewParamsToViewList.mockImplementation(() => resolvedViewList);
    mockGetViewDiffAndUpdateHidden.mockImplementation((prevViewList, currentViewList) => ({
      viewsToClose: prevViewList.filter((prevViewItem) => !currentViewList.includes(prevViewItem)),
      viewsToOpen: currentViewList.filter((currentViewItem) => !prevViewList.includes(currentViewItem)),
    }));
    mockGetOpenViewStepParams.mockReturnValue({
      collectionName: '',
      dataSourceKey: '',
    });

    const coordinator = new BaseLayoutRouteCoordinator(engine, { basePathname: '/admin' });
    coordinator.setLayoutContentElement(document.createElement('div'));
    coordinator.registerPage('test-route', {
      active: true,
      layoutContentElement: document.createElement('div'),
    });
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route',
    });

    resolvedViewList = [rootViewItem, popupViewItem];
    coordinator.syncRoute({
      pageUid: 'test-route',
      pathname: '/admin/test-route/view/popup',
    });
    navigate.mockClear();

    const nextLayoutContentElement = document.createElement('div');
    coordinator.setLayoutContentElement(nextLayoutContentElement);

    expect(navigate).not.toHaveBeenCalled();
    expect(popupDispatchEvent).toHaveBeenCalledTimes(2);
    expect(popupDispatchEvent.mock.calls[1][1].target).toBe(nextLayoutContentElement);
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

    const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.activateRef.current = vi.fn();
      payload.deactivateRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = createViewItem('test-route', dispatchEvent);
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

    const viewItemsByPageUid = new Map<string, ViewItem>();
    const createCachedViewItem = (pageUid: string) => {
      const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
        payload.activateRef.current = vi.fn();
        payload.deactivateRef.current = vi.fn();
        return Promise.resolve();
      });
      return createViewItem(pageUid, dispatchEvent);
    };

    mockResolveViewParamsToViewList.mockImplementation((_engine, viewParams) => {
      const pageUid = viewParams[0].viewUid;
      if (!viewItemsByPageUid.has(pageUid)) {
        viewItemsByPageUid.set(pageUid, createCachedViewItem(pageUid));
      }
      const viewItem = viewItemsByPageUid.get(pageUid);
      if (!viewItem) {
        throw new Error(`Expected cached view item for ${pageUid}.`);
      }
      return [viewItem];
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

    const dispatchEvent = createDispatchEventMock((_eventName, payload) => {
      payload.activateRef.current = vi.fn();
      payload.deactivateRef.current = vi.fn();
      return Promise.resolve();
    });
    const viewItem = createViewItem('test-route', dispatchEvent);
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

    const popupViewItem = createViewItem('popup', createDispatchEventMock(), 1, {
      viewUid: 'popup',
      filterByTk: '1',
    });
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
