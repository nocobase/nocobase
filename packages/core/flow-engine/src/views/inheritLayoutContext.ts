/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '../flowContext';

export function inheritLayoutContextForDetachedView(viewContext: FlowContext, sourceContext: FlowContext) {
  const layoutContext = sourceContext?.layoutContext;
  const engineContext = sourceContext?.engine?.context;

  if (!(layoutContext instanceof FlowContext)) {
    return;
  }

  if (layoutContext === sourceContext || layoutContext === engineContext) {
    return;
  }

  // inheritContext=false 只隔离业务上下文，Layout 运行时上下文仍需要传给弹窗/嵌入视图。
  viewContext.addDelegate(layoutContext);
}
