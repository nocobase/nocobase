/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/reactive-react';
import { useFlowEngine } from '../../provider';

/**
 * 高阶组件：仅在设计模式启用时渲染子组件
 *
 * @param WrappedComponent 要包装的组件
 * @returns 包装后的组件，只在 flowSettings.enabled 为 true 时渲染
 *
 * @example
 * ```tsx
 * const MyComponent = withFlowDesignMode(({ model, ...props }) => {
 *   // 这些计算只在设计模式启用时才会执行
 *   const expensiveData = useMemo(() => complexCalculation(), []);
 *
 *   return <div>{expensiveData}</div>;
 * });
 * ```
 */
export function withFlowDesignMode<P extends Record<string, any>>(WrappedComponent: React.ComponentType<P>) {
  const WithFlowDesignModeComponent = observer((props: P) => {
    const flowEngine = useFlowEngine();

    // 如果设计模式未启用，直接返回 null，避免执行子组件的计算
    if (!flowEngine.flowSettings.enabled) {
      return null;
    }

    // 只有在设计模式启用时才渲染实际组件
    return <WrappedComponent {...props} />;
  });

  // 保持原组件的 displayName 用于调试
  WithFlowDesignModeComponent.displayName = `withFlowDesignMode(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithFlowDesignModeComponent;
}
