/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useFlowEngine } from '../provider';
// import { useApp } from '@nocobase/client'; // 移除对 @nocobase/client 的依赖
import { FlowContext } from '../types';

export function useFlowContext(): FlowContext {
  const engine = useFlowEngine();
  // const app = useApp(); // 移除 app 的获取

  // 创建并返回上下文对象
  const context = useMemo(
    () =>
      ({
        engine,
        // app, // 移除 app
      }) as FlowContext,
    [engine],
  );

  return context;
}
