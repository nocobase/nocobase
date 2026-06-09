/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { openView } from '@nocobase/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mobileOpenView, resolveMobileOpenViewInputArgs, resolveMobileOpenViewParams } from '../mobileOpenViewAction';

type OpenViewContext = Parameters<typeof resolveMobileOpenViewParams>[0];
type OpenViewParams = Parameters<typeof resolveMobileOpenViewParams>[1];

function createContext(inputArgs: Record<string, unknown>, isMobileLayout = false) {
  return {
    inputArgs,
    isMobileLayout,
  } as OpenViewContext;
}

function createReadonlyContext(inputArgs: Record<string, unknown>) {
  const ctx = {
    isMobileLayout: true,
    model: {
      context: {
        inputArgs: {},
        defineProperty(key: string, descriptor: PropertyDescriptor) {
          Object.defineProperty(this, key, {
            configurable: true,
            ...descriptor,
          });
        },
      },
    },
    defineProperty(key: string, descriptor: PropertyDescriptor) {
      Object.defineProperty(this, key, {
        configurable: true,
        ...descriptor,
      });
    },
  };

  Object.defineProperty(ctx, 'inputArgs', {
    configurable: true,
    get: () => inputArgs,
  });

  return ctx as OpenViewContext & { defineProperty: (key: string, descriptor: PropertyDescriptor) => void };
}

function createContextWithModelInputArgs(inputArgs: Record<string, unknown>, modelInputArgs: Record<string, unknown>) {
  const modelContext = {
    inputArgs: modelInputArgs,
    defineProperty(key: string, descriptor: PropertyDescriptor) {
      Object.defineProperty(this, key, {
        configurable: true,
        ...descriptor,
      });
    },
  };

  return {
    inputArgs,
    isMobileLayout: true,
    model: {
      context: modelContext,
    },
  } as OpenViewContext & {
    model: {
      context: typeof modelContext;
    };
  };
}

describe('mobileOpenViewAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should replace the default child page model for mobile route replays', () => {
    const params = {
      mode: 'embed',
      pageModelClass: 'ChildPageModel',
    } as OpenViewParams;

    expect(resolveMobileOpenViewParams(createContext({ isMobileLayout: true }), params)).toMatchObject({
      mode: 'embed',
      pageModelClass: 'MobileChildPageModel',
    });
  });

  it('should replace the default input page model for mobile route replays', () => {
    const ctx = createContext({
      isMobileLayout: true,
      pageModelClass: 'ChildPageModel',
    });

    expect(resolveMobileOpenViewInputArgs(ctx, {} as OpenViewParams)).toMatchObject({
      isMobileLayout: true,
      pageModelClass: 'MobileChildPageModel',
    });
  });

  it('should preserve an explicit input page model class', () => {
    const params = {
      pageModelClass: 'ChildPageModel',
    } as OpenViewParams;
    const ctx = createContext({ isMobileLayout: true, pageModelClass: 'CustomChildPageModel' });

    expect(resolveMobileOpenViewParams(ctx, params)).toBe(params);
    expect(resolveMobileOpenViewInputArgs(ctx, params)).toBe(ctx.inputArgs);
  });

  it('should preserve a custom params page model class', () => {
    const params = {
      pageModelClass: 'CustomChildPageModel',
    } as OpenViewParams;

    expect(resolveMobileOpenViewParams(createContext({ isMobileLayout: true }), params)).toBe(params);
  });

  it('should override readonly input args while delegating to the core handler', async () => {
    const inputArgs = {
      isMobileLayout: true,
      pageModelClass: 'ChildPageModel',
    };
    const ctx = createReadonlyContext(inputArgs);
    let delegatedInputArgs: unknown;
    const coreHandler = vi.spyOn(openView, 'handler').mockImplementation(async (delegatedCtx) => {
      delegatedInputArgs = delegatedCtx.inputArgs;
    });

    await mobileOpenView.handler(ctx, {} as OpenViewParams);

    expect(coreHandler).toHaveBeenCalledTimes(1);
    expect(delegatedInputArgs).toMatchObject({
      isMobileLayout: true,
      pageModelClass: 'MobileChildPageModel',
    });
    expect(ctx.inputArgs).toBe(inputArgs);
  });

  it('should expose the mobile child page model on the opener model context', async () => {
    const ctx = createContextWithModelInputArgs(
      {
        isMobileLayout: true,
        pageModelClass: 'ChildPageModel',
      },
      {
        customFlag: 'keep',
      },
    );
    vi.spyOn(openView, 'handler').mockResolvedValue(undefined);

    await mobileOpenView.handler(ctx, {} as OpenViewParams);

    expect(ctx.model.context.inputArgs).toMatchObject({
      customFlag: 'keep',
      isMobileLayout: true,
      pageModelClass: 'MobileChildPageModel',
    });
  });

  it('should expose the mobile layout flag on the opener model context', async () => {
    const ctx = createContextWithModelInputArgs(
      {
        isMobileLayout: true,
        pageModelClass: 'ChildPageModel',
      },
      {},
    );
    vi.spyOn(openView, 'handler').mockResolvedValue(undefined);

    await mobileOpenView.handler(ctx, {} as OpenViewParams);

    expect(ctx.model.context.isMobileLayout).toBe(true);
  });
});
