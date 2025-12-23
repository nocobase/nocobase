/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '@nocobase/flow-engine';
import { REF_HOST_CTX_KEY } from '../constants';

const DEFAULT_MAX_ANCESTOR_DEPTH = 8;

/**
 * 向上遍历 parent 链查找满足条件的模型（包含自身）
 * @param model 起始模型（会首先检查自身是否满足条件）
 * @param predicate 判断函数，返回 true 时停止查找
 * @param maxDepth 最大查找深度，默认 8
 */
export function findSelfOrAncestor(
  model: FlowModel,
  predicate: (m: FlowModel) => boolean,
  maxDepth = DEFAULT_MAX_ANCESTOR_DEPTH,
): FlowModel | undefined {
  let cur: FlowModel | undefined = model;
  for (let depth = 0; cur && depth < maxDepth; depth++) {
    if (predicate(cur)) return cur;
    cur = cur.parent as FlowModel | undefined;
  }
  return undefined;
}

type RefHostInfo = {
  ref?: {
    mountSubKey?: unknown;
    mode?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function findRefHostInfoFromAncestors(
  model: FlowModel,
  options?: { maxDepth?: number },
): RefHostInfo | undefined {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_ANCESTOR_DEPTH;
  const found = findSelfOrAncestor(
    model,
    (cur) => {
      const ctx = cur.context as unknown as Record<string, unknown>;
      // 只读取自身 context 上定义的 host 信息，避免从 delegate 链"误捡到"其他 view/弹窗的标记
      return ctx && Object.prototype.hasOwnProperty.call(ctx, REF_HOST_CTX_KEY) && !!ctx[REF_HOST_CTX_KEY];
    },
    maxDepth,
  );
  if (!found) return undefined;
  return (found.context as unknown as Record<string, unknown>)[REF_HOST_CTX_KEY] as RefHostInfo | undefined;
}
