/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { openView } from '../openView';

describe('openView action - close/destroy logic', () => {
  const createMockCtx = (inputArgs: any = {}) => {
    const engine = {
      context: { themeToken: { colorBgLayout: '#fff' } },
    } as any;

    const ctx: any = {
      inputArgs,
      engine,
      model: {
        uid: 'test-uid',
        flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
      },
      layoutContentElement: {},
      view: {},
      viewer: {
        open: vi.fn(async (_opts: any) => undefined),
      },
    };

    return ctx;
  };

  it('should pass destroyRef to viewer content', async () => {
    const destroyRef = { current: null };
    const ctx = createMockCtx({ destroyRef });

    let capturedContent: any;
    (ctx.viewer.open as any).mockImplementation(async (opts: any) => {
      capturedContent = opts.content;
      return undefined;
    });

    await openView.handler(ctx, {});

    const mockView = { destroy: vi.fn(), update: vi.fn() };
    capturedContent(mockView);

    expect(destroyRef.current).toBe(mockView.destroy);
  });

  it('should set triggerByRouter in viewer options', async () => {
    const ctx = createMockCtx({ triggerByRouter: true });

    await openView.handler(ctx, {});

    expect(ctx.viewer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerByRouter: true,
      }),
    );
  });

  it('should omit triggerByRouter from inputArgs passed to viewer', async () => {
    const ctx = createMockCtx({ triggerByRouter: true, otherArg: 'value' });

    await openView.handler(ctx, {});

    const callArgs = (ctx.viewer.open as any).mock.calls[0][0];
    expect(callArgs.inputArgs).not.toHaveProperty('triggerByRouter');
    expect(callArgs.inputArgs).toHaveProperty('otherArg', 'value');
  });
});
