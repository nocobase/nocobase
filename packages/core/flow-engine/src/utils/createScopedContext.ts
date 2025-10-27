/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, type PropertyOptions } from '../flowContext';

type BridgeKey<TCtx extends FlowContext> = keyof TCtx & string;

type BridgeItem<TCtx extends FlowContext> =
  | BridgeKey<TCtx>
  | {
      key: BridgeKey<TCtx>;
      cache?: PropertyOptions['cache'];
      getter?: () => any;
    };

/**
 * Create a scoped context that delegates to parent context.
 * Optionally bridge direct fields (non-defineProperty) via getters.
 */
export function createScopedContext<TCtx extends FlowContext>(parent: TCtx, bridge?: BridgeItem<TCtx>[]): TCtx {
  const scoped = new FlowContext();
  scoped.addDelegate(parent);

  if (Array.isArray(bridge)) {
    for (const item of bridge) {
      const k = typeof item === 'string' ? item : item.key;
      const cache = typeof item === 'string' ? undefined : (item as { cache?: PropertyOptions['cache'] }).cache;
      const getter = typeof item === 'string' ? undefined : (item as { getter?: () => any }).getter;
      scoped.defineProperty(k, {
        get: getter || (() => Reflect.get(parent, k)),
        ...(typeof cache === 'undefined' ? {} : { cache }),
      });
    }
  }

  return scoped.createProxy() as TCtx;
}
