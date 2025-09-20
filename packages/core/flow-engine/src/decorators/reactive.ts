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

/**
 * @deprecated 已废弃，已经不需要了，render函数会自动处理响应式更新
 * 响应式装饰器，用于让FlowModel的render方法自动支持响应式更新
 *
 * 使用方式：
 * ```tsx
 * export class MyModel extends FlowModel {
 *   @reactive
 *   public render(): React.ReactNode {
 *     return <div>{this.someReactiveProperty}</div>;
 *   }
 * }
 * ```
 */
export function reactive<T extends (...args: any[]) => React.ReactNode>(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> | void {
  const originalMethod = descriptor.value;

  if (typeof originalMethod !== 'function') {
    throw new Error('@reactive decorator can only be applied to methods');
  }

  descriptor.value = function (this: any, ...args: any[]) {
    // 创建一个响应式组件包装器
    const ReactiveWrapper = observer(() => {
      // 在observer内部调用原始的render方法
      this.props; // 这样能保证及时 render 函数内部没有用到 this.props，也能触发响应式更新 （例如this.context.xxx）
      return originalMethod.apply(this, args);
    });

    // 返回响应式组件
    return React.createElement(ReactiveWrapper);
  } as T;

  return descriptor;
}
