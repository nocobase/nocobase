/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { RUNJS_OPEN_VIEW_ROUTE_STATE } from '@nocobase/flow-engine';
import { openView } from '../openView';
import { FlowPage } from '../../FlowPage';
import { ROUTE_TRANSIENT_INPUT_ARGS_KEY } from '../../routeTransientInputArgs';

describe('openView action - route mode defineProperties/defineMethods', () => {
  const createRouteManagedCtx = () => {
    const engine = {
      getModel: vi.fn(),
      context: { themeToken: { colorBgLayout: '#fff' } },
    } as any;

    const ctx: any = {
      inputArgs: {
        // presence of navigation means we are in the route-managed (second stage) open
        navigation: { back: vi.fn(), navigateTo: vi.fn() },
      },
      engine,
      model: {
        uid: 'parent-uid',
        // simulate what ctx.openView(uid, options) injected in child stage
        context: {
          inputArgs: {
            defineProperties: {
              exposedToken: { get: () => 'ok' },
            },
            defineMethods: {
              ping: vi.fn(),
            },
          },
        },
        flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      },
      layoutContentElement: {},
      view: {},
      viewer: {
        open: vi.fn(async (_opts: any) => undefined),
      },
    };

    return { ctx, engine };
  };

  const createFirstStageCtx = (inputArgs: Record<PropertyKey, unknown>) => {
    const navigateTo = vi.fn();
    const ctx: any = {
      inputArgs,
      engine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      model: {
        uid: 'popup-uid',
        context: {
          inputArgs: {},
          defineProperty: vi.fn(),
        },
        flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      },
      view: {
        navigation: { navigateTo },
      },
    };

    return { ctx, navigateTo };
  };

  it('injects defineProperties/defineMethods on onModelLoaded even when not present in current inputArgs', async () => {
    const { ctx } = createRouteManagedCtx();

    let capturedElement: any;
    (ctx.viewer.open as any).mockImplementation(async (opts) => {
      // emulate runtime: content function returns a React element with onModelLoaded
      const currentView = { close: vi.fn(), update: vi.fn() };
      capturedElement = opts.content(currentView);
      return undefined;
    });

    // call handler with NO defineProperties/defineMethods in current inputArgs
    await openView.handler(ctx, { navigation: true });

    expect(capturedElement?.type).toBe(FlowPage);
    const onModelLoaded = capturedElement?.props?.onModelLoaded as (uid: string, model: any) => void;
    expect(typeof onModelLoaded).toBe('function');

    const pageModelContext = {
      defineProperty: vi.fn(),
      defineMethod: vi.fn(),
    };
    const pageModel = {
      context: pageModelContext,
      invalidateFlowCache: vi.fn(),
      _rerunLastAutoRun: vi.fn(),
    } as any;

    onModelLoaded('child-uid', pageModel);

    // expect defineProperty called for currentView/closable + custom exposedToken
    const definePropertyCalls = pageModelContext.defineProperty.mock.calls.map((c: any[]) => c[0]);
    expect(definePropertyCalls).toContain('currentView');
    expect(definePropertyCalls).toContain('closable');
    expect(definePropertyCalls).toContain('exposedToken');

    // expect defineMethod called for custom ping
    const defineMethodCalls = pageModelContext.defineMethod.mock.calls.map((c: any[]) => c[0]);
    expect(defineMethodCalls).toContain('ping');
  });

  it('non-route mode: injects defineProperties/defineMethods from current inputArgs', async () => {
    const engine = {
      context: { themeToken: { colorBgLayout: '#fff' } },
    } as any;

    const ctx: any = {
      // no navigation means non-route mode, open directly
      inputArgs: {
        defineProperties: {
          tokenA: { get: () => 'A' },
        },
        defineMethods: {
          pong: vi.fn(),
        },
      },
      engine,
      model: {
        uid: 'parent-uid',
        flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      },
      layoutContentElement: {},
      view: {},
      viewer: {
        open: vi.fn(async (_opts: any) => undefined),
      },
    };

    let capturedElement: any;
    (ctx.viewer.open as any).mockImplementation(async (opts) => {
      const currentView = { close: vi.fn(), update: vi.fn() };
      capturedElement = opts.content(currentView);
      return undefined;
    });

    await openView.handler(ctx, { navigation: false });

    expect(capturedElement?.type).toBe(FlowPage);
    const onModelLoaded = capturedElement?.props?.onModelLoaded as (uid: string, model: any) => void;
    expect(typeof onModelLoaded).toBe('function');

    const pageModelContext = {
      defineProperty: vi.fn(),
      defineMethod: vi.fn(),
    };
    const pageModel = {
      context: pageModelContext,
      invalidateFlowCache: vi.fn(),
      _rerunLastAutoRun: vi.fn(),
    } as any;

    onModelLoaded('child-uid', pageModel);

    const definePropertyCalls = pageModelContext.defineProperty.mock.calls.map((c: any[]) => c[0]);
    expect(definePropertyCalls).toContain('tokenA');

    const defineMethodCalls = pageModelContext.defineMethod.mock.calls.map((c: any[]) => c[0]);
    expect(defineMethodCalls).toContain('pong');
  });

  it('passes formData through route navigation state', async () => {
    const navigateTo = vi.fn();
    const ctx: any = {
      inputArgs: {
        formData: {
          start: '2026-06-24 08:00:00',
          end: '2026-06-24 09:00:00',
        },
      },
      engine: {
        context: {},
      },
      model: {
        uid: 'popup-uid',
        context: {
          defineProperty: vi.fn(),
        },
      },
      view: {
        navigation: {
          navigateTo,
        },
      },
      isNavigationEnabled: true,
    };

    await openView.handler(ctx, { navigation: true });

    expect(navigateTo).toHaveBeenCalledWith(
      {
        viewUid: 'popup-uid',
        filterByTk: undefined,
        sourceId: undefined,
        tabUid: undefined,
      },
      {
        state: {
          [ROUTE_TRANSIENT_INPUT_ARGS_KEY]: {
            'popup-uid': {
              formData: {
                start: '2026-06-24 08:00:00',
                end: '2026-06-24 09:00:00',
              },
            },
          },
        },
      },
    );
  });

  it('adds route state to first-stage navigation only for RunJS ctx.openView calls', async () => {
    const { ctx, navigateTo } = createFirstStageCtx({
      mode: 'dialog',
      size: 'large',
      [RUNJS_OPEN_VIEW_ROUTE_STATE]: { mode: 'dialog', size: 'large' },
    });

    await openView.handler(ctx, { mode: 'drawer', size: 'medium', navigation: true });

    expect(navigateTo).toHaveBeenCalledWith(
      {
        viewUid: 'popup-uid',
        filterByTk: undefined,
        sourceId: undefined,
        tabUid: undefined,
        openViewRouteState: { mode: 'dialog', size: 'large' },
      },
      undefined,
    );
  });

  it('normalizes first-stage RunJS route state mode on mobile layout', async () => {
    const { ctx, navigateTo } = createFirstStageCtx({
      isMobileLayout: true,
      mode: 'dialog',
      size: 'large',
      [RUNJS_OPEN_VIEW_ROUTE_STATE]: { mode: 'dialog', size: 'large' },
    });

    await openView.handler(ctx, { mode: 'drawer', size: 'medium', navigation: true });

    expect(navigateTo).toHaveBeenCalledWith(
      {
        viewUid: 'popup-uid',
        filterByTk: undefined,
        sourceId: undefined,
        tabUid: undefined,
        openViewRouteState: { mode: 'embed', size: 'large' },
      },
      undefined,
    );
  });

  it('uses route replay mode and size before persisted openView defaults', async () => {
    const { ctx } = createRouteManagedCtx();
    ctx.inputArgs.mode = 'dialog';
    ctx.inputArgs.size = 'large';

    await openView.handler(ctx, { mode: 'drawer', size: 'medium', navigation: true });

    expect(ctx.viewer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        width: '80%',
      }),
    );
  });

  it('uses decoded openView route state during route replay', async () => {
    const { ctx } = createRouteManagedCtx();
    ctx.inputArgs.openViewRouteState = { mode: 'dialog', size: 'large' };

    await openView.handler(ctx, { mode: 'drawer', size: 'medium', navigation: true });

    expect(ctx.viewer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'dialog',
        width: '80%',
      }),
    );
  });

  it('keeps first-stage navigation unchanged for non-RunJS openView calls', async () => {
    const { ctx, navigateTo } = createFirstStageCtx({
      mode: 'dialog',
      size: 'large',
    });

    await openView.handler(ctx, { mode: 'drawer', size: 'medium', navigation: true });

    expect(navigateTo).toHaveBeenCalledWith(
      {
        viewUid: 'popup-uid',
        filterByTk: undefined,
        sourceId: undefined,
        tabUid: undefined,
      },
      undefined,
    );
  });
});
