/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateToSpy, setViewStackSpy } = vi.hoisted(() => {
  return {
    navigateToSpy: vi.fn(),
    setViewStackSpy: vi.fn(),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  class MockViewNavigation {
    constructor(
      public context: any,
      public viewStack: any[],
    ) {}
    navigateTo(params: any, options?: any) {
      navigateToSpy({ params, options, viewStack: this.viewStack });
    }
    setViewStack(viewStack: any[]) {
      setViewStackSpy({ viewStack });
      this.viewStack = viewStack;
    }
  }

  return {
    ...actual,
    ViewNavigation: MockViewNavigation,
  };
});

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { RouteModel } from '../../../../flow/models/base/RouteModel';
import { AdminLayoutRouteCoordinator } from '../AdminLayoutRouteCoordinator';

const flushPromises = async (times = 3) => {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
};

const createEngine = () => {
  const engine = new FlowEngine();
  engine.registerModels({ RouteModel });
  return engine;
};

describe('AdminLayoutRouteCoordinator', () => {
  beforeEach(() => {
    navigateToSpy.mockClear();
    setViewStackSpy.mockClear();
  });

  it('should split deep link to step navigation on first sync', () => {
    const engine = createEngine();
    const coordinator = new AdminLayoutRouteCoordinator(engine);
    const loadSpy = vi.spyOn(engine, 'loadModel');

    coordinator.registerPage('page-1', {
      active: true,
      currentRoute: { title: 'Page 1' },
    });

    coordinator.syncRoute({
      params: { name: 'page-1' },
      pathname: '/admin/page-1/view/popup-1',
    });

    expect(navigateToSpy).toHaveBeenCalledTimes(2);
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('should cleanup opened views and remove models', async () => {
    const engine = createEngine();
    const coordinator = new AdminLayoutRouteCoordinator(engine);
    const removeSpy = vi.spyOn(engine, 'removeModelWithSubModels');
    coordinator.setLayoutContentElement(document.createElement('div'));

    coordinator.registerPage('page-1', {
      active: true,
      currentRoute: { title: 'Page 1' },
    });

    const routeModel = engine.getModel<RouteModel>('page-1') as RouteModel;
    const routeDestroySpy = vi.fn();
    routeModel.dispatchEvent = vi.fn(async (_eventName: string, args: any) => {
      args.destroyRef.current = routeDestroySpy;
      args.onOpen?.();
    }) as any;

    const popupModel = engine.createModel<FlowModel>({
      uid: 'popup-1',
      use: 'FlowModel',
    });
    const popupDestroySpy = vi.fn();
    popupModel.dispatchEvent = vi.fn(async (_eventName: string, args: any) => {
      args.destroyRef.current = popupDestroySpy;
    }) as any;

    coordinator.syncRoute({
      params: { name: 'page-1' },
      pathname: '/admin/page-1/view/popup-1',
    });
    coordinator.syncRoute({
      params: { name: 'page-1' },
      pathname: '/admin/page-1/view/popup-1',
    });
    await flushPromises();

    coordinator.cleanupPage('page-1');

    expect(removeSpy).toHaveBeenCalledWith('page-1');
    expect(removeSpy).toHaveBeenCalledWith('popup-1');
    expect(routeDestroySpy).toHaveBeenCalled();
    expect(popupDestroySpy).toHaveBeenCalled();
  });

  it('should stop opening stale views when route switched to another page', async () => {
    const engine = createEngine();
    const coordinator = new AdminLayoutRouteCoordinator(engine);

    coordinator.registerPage('page-1', {
      active: true,
      currentRoute: { title: 'Page 1' },
    });
    coordinator.registerPage('page-2', {
      active: true,
      currentRoute: { title: 'Page 2' },
    });

    const page1RouteModel = engine.getModel<RouteModel>('page-1') as RouteModel;
    const page2RouteModel = engine.getModel<RouteModel>('page-2') as RouteModel;
    page1RouteModel.dispatchEvent = vi.fn() as any;
    page2RouteModel.dispatchEvent = vi.fn() as any;

    let resolveLoad: (model: FlowModel) => void;
    const loadPromise = new Promise<FlowModel>((resolve) => {
      resolveLoad = resolve;
    });
    vi.spyOn(engine, 'loadModel').mockImplementation(async ({ uid }: { uid: string }) => {
      if (uid === 'popup-1') {
        return loadPromise;
      }
      return undefined;
    });

    coordinator.syncRoute({
      params: { name: 'page-1' },
      pathname: '/admin/page-1/view/popup-1',
    });
    coordinator.syncRoute({
      params: { name: 'page-1' },
      pathname: '/admin/page-1/view/popup-1',
    });

    coordinator.syncRoute({
      params: { name: 'page-2' },
      pathname: '/admin/page-2',
    });

    const popupModel = engine.createModel<FlowModel>({
      uid: 'popup-1',
      use: 'FlowModel',
    });
    const popupDispatchSpy = vi.fn();
    popupModel.dispatchEvent = popupDispatchSpy as any;

    if (!resolveLoad) {
      throw new Error('resolveLoad should be initialized');
    }
    resolveLoad(popupModel);
    await flushPromises(5);

    expect(popupDispatchSpy).not.toHaveBeenCalled();
    expect(page1RouteModel.dispatchEvent).not.toHaveBeenCalled();
  });
});
