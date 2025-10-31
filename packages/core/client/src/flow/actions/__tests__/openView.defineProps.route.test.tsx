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
import { openView } from '../openView';
import { FlowPage } from '../../FlowPage';

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
});
