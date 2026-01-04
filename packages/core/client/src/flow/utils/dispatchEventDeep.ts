/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import type { DispatchEventOptions } from '@nocobase/flow-engine';

/**
 * 递归向子模型（及其 forks）分发指定事件。
 * - 默认不包含自身（避免误触发当前层的其它逻辑）
 * - 用于类似分页切换等“只需要刷新子层状态”的场景（例如 `paginationChange`）
 */
export async function dispatchEventDeep(
  root: FlowModel,
  eventName: string,
  inputArgs?: Record<string, any>,
  options?: { debounce?: boolean } & DispatchEventOptions,
  deepOptions?: { includeSelf?: boolean; includeForks?: boolean },
): Promise<void> {
  const includeSelf = deepOptions?.includeSelf ?? false;
  const includeForks = deepOptions?.includeForks ?? true;

  const visited = new Set<FlowModel>();
  const stack: FlowModel[] = [root];
  const tasks: Promise<any>[] = [];

  const enqueueDispatch = (target: any) => {
    if (!target || typeof target.dispatchEvent !== 'function') return;
    tasks.push(target.dispatchEvent(eventName, inputArgs, options as any));
  };

  while (stack.length) {
    const current = stack.pop() as FlowModel;
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const shouldDispatch = includeSelf || current !== root;
    if (shouldDispatch) {
      enqueueDispatch(current);
      if (includeForks && (current as any).forks?.size) {
        (current as any).forks.forEach((fork) => {
          if ((fork as any)?.disposed) return;
          enqueueDispatch(fork as any);
        });
      }
    }

    const subModels = (current as any).subModels as Record<string, any> | undefined;
    if (!subModels) continue;
    for (const value of Object.values(subModels)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item instanceof FlowModel) stack.push(item);
        }
      } else if (value instanceof FlowModel) {
        stack.push(value);
      }
    }
  }

  await Promise.all(tasks);
}
