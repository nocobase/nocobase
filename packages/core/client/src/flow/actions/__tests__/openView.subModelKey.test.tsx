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

describe('openView action - subModelKey behavior', () => {
  const createCtx = () => {
    const engine = {
      loadOrCreateModel: vi.fn(),
      getModel: vi.fn(),
      context: { themeToken: { colorBgLayout: '#fff' } },
    } as any;

    const ctx: any = {
      inputArgs: {},
      engine,
      model: {
        uid: 'parent-model-uid',
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

  it('creates container under ctx.model when subModelKey is provided and uses it as parentId', async () => {
    const { ctx, engine } = createCtx();

    engine.loadOrCreateModel.mockResolvedValueOnce({ uid: 'container-uid' });

    let capturedElement: any;
    (ctx.viewer.open as any).mockImplementation(async (opts) => {
      // call content to get the React element
      const currentView = { close: vi.fn(), update: vi.fn() };
      capturedElement = opts.content(currentView);
      return undefined;
    });

    await openView.handler(ctx, { subModelKey: 'myContainer', navigation: false });

    // ensure container created with expected options
    expect(engine.loadOrCreateModel).toHaveBeenCalledTimes(1);
    expect(engine.loadOrCreateModel).toHaveBeenCalledWith({
      async: true,
      parentId: 'parent-model-uid',
      subKey: 'myContainer',
      subType: 'object',
      use: 'FlowModel',
    });

    // ensure FlowPage receives container uid as parentId
    expect(capturedElement?.type).toBe(FlowPage);
    expect(capturedElement?.props?.parentId).toBe('container-uid');
    // still passes ChildPageModel by default so downstream will create tabs
    expect(capturedElement?.props?.pageModelClass).toBe('ChildPageModel');
  });

  it('uses ctx.model.uid as parentId when subModelKey is not provided', async () => {
    const { ctx, engine } = createCtx();

    let capturedElement: any;
    (ctx.viewer.open as any).mockImplementation(async (opts) => {
      const currentView = { close: vi.fn(), update: vi.fn() };
      capturedElement = opts.content(currentView);
      return undefined;
    });

    await openView.handler(ctx, { navigation: false });

    // container should not be created
    expect(engine.loadOrCreateModel).not.toHaveBeenCalled();

    // FlowPage should receive parent model uid
    expect(capturedElement?.type).toBe(FlowPage);
    expect(capturedElement?.props?.parentId).toBe('parent-model-uid');
    expect(capturedElement?.props?.pageModelClass).toBe('ChildPageModel');
  });
});
