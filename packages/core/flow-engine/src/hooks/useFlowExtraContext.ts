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

/**
 * Hook to get extra context for flow execution
 * This is used to prepare context data before calling applyFlow
 * @returns Extra context object that can be passed to applyFlow
 */
export function useFlowExtraContext(): Record<string, any> {
  // const app = useApp(); // 移除 app 的获取

  // 创建并返回额外上下文对象
  const extraContext = useMemo(
    () => ({
      // // 可以在这里添加从 React 上下文中获取的数据
      // globals: engine.getContext() || {},
      // timestamp: new Date().toISOString(),
      // // app: app, // 如果需要的话可以添加 app 实例
    }),
    [],
  );

  return extraContext;
}
