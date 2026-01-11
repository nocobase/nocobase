/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { useKeepAlive } from '../route-switch/antd/admin-layout/KeepAlive';

/**
 * 为组件添加自动聚焦功能的高阶函数
 *
 * 当页面处于激活状态且组件的 autoFocus 属性为 true 时，
 * 自动聚焦到组件元素上
 *
 * @example
 * ```typescript
 * const AutoFocusButton = withAutoFocus(Button);
 * <AutoFocusButton autoFocus>Click me</AutoFocusButton>
 * ```
 *
 * @param Component - 要包装的 React 组件
 * @returns 包装后的组件，支持 autoFocus 属性
 */
export function withAutoFocus<T extends Record<string, any>>(Component: React.ComponentType<T>) {
  const WrappedComponent = forwardRef<any, T & { autoFocus?: boolean }>((props, ref) => {
    const { autoFocus, ...otherProps } = props;
    const { active } = useKeepAlive();
    const elementRef = useRef<any>(null);

    // 合并 ref
    const mergedRef = ref || elementRef;

    // 判断是否应该自动聚焦：需要 autoFocus 为 true 且页面处于激活状态
    const shouldAutoFocus = autoFocus && active;

    useEffect(() => {
      if (shouldAutoFocus && mergedRef && typeof mergedRef === 'object' && mergedRef.current) {
        // 尝试直接调用 focus 方法
        if (typeof mergedRef.current.focus === 'function') {
          mergedRef.current.focus();
        }
      }
    }, [shouldAutoFocus, mergedRef]);

    return <Component {...(otherProps as unknown as T)} ref={mergedRef} autoFocus={autoFocus} />;
  });

  // 设置显示名称
  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withAutoFocus(${displayName})`;

  return WrappedComponent;
}
