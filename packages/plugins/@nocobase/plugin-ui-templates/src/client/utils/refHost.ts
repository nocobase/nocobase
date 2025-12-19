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

export type RefHostInfo = {
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
  const maxDepth = options?.maxDepth ?? 8;
  let cur: FlowModel | undefined = model;
  let depth = 0;
  while (cur && depth < maxDepth) {
    try {
      const ctx = cur.context as unknown as Record<string, unknown>;
      // 只读取自身 context 上定义的 host 信息，避免从 delegate 链“误捡到”其他 view/弹窗的标记
      if (ctx && Object.prototype.hasOwnProperty.call(ctx, REF_HOST_CTX_KEY)) {
        const v = ctx[REF_HOST_CTX_KEY] as RefHostInfo | undefined;
        if (v) return v;
      }
    } catch {
      // ignore
    }
    cur = cur.parent as FlowModel | undefined;
    depth++;
  }
  return undefined;
}
