/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class ContextPathProxy {
  [key: string]: any;

  constructor(private path: string[]) {}

  toString(): string {
    return `{{${this.path.join('.')}}}`;
  }

  valueOf(): string {
    return this.toString();
  }

  [Symbol.toPrimitive](): string {
    return this.toString();
  }

  static create(path: string[] = ['ctx']): any {
    return new Proxy(new ContextPathProxy(path), {
      get(target, prop, receiver) {
        // 忽略 symbol 类型属性（如 inspect、自定义 iterator 等）
        if (typeof prop === 'symbol') return undefined;

        // 优先返回 ContextPathProxy 实例上的已有属性或方法
        if (prop in target) {
          const value = (target as any)[prop];
          return typeof value === 'function' ? value.bind(target) : value;
        }

        // 构建新的代理路径
        const newPath = [...path, prop.toString()];
        return ContextPathProxy.create(newPath);
      },
    });
  }
}
