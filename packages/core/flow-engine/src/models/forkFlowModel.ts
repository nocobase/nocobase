/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@formily/reactive';
import type { IModelComponentProps } from '../types';
import { FlowModel } from './flowModel';

/**
 * ForkFlowModel 作为 FlowModel 的轻量代理实例：
 *  - 共享 master（原始 FlowModel）上的所有业务数据与方法
 *  - 仅在 props 层面拥有本地覆盖(localProps)，其余字段全部透传到 master
 *  - 透传的函数中 this 指向 fork 实例，而非 master，确保正确的上下文
 *  - 使用 Object.create 创建临时上下文，确保 this.constructor 指向正确的类（避免异步竞态条件）
 *  - setter 方法中的 this 也指向 fork 实例，保持一致的上下文行为
 *  - 不会被注册到 FlowEngine.modelInstances 中，保持 uid → master 唯一性假设
 */
export class ForkFlowModel<TMaster extends FlowModel = FlowModel> {
  /** 与 master 相同的 UID，用于日志调试 */
  public readonly uid: string;
  /** 调试标识，便于在日志或断言中快速识别 */
  public readonly isFork = true;

  /** 本地覆盖的 props，fork 层面的 UI/状态 */
  public localProps: IModelComponentProps;

  /** master 引用 */
  private master: TMaster;

  /** 是否已被释放 */
  private disposed = false;

  /** fork 在 master.forks 中的索引 */
  public readonly forkId: number;

  /** 用于共享上下文的对象，存储跨 fork 的共享数据 */
  private _sharedContext: Record<string, any> = {};

  constructor(master: TMaster, initialProps: IModelComponentProps = {}, forkId = 0) {
    this.master = master;
    this.uid = master.uid;
    this.localProps = { ...initialProps };
    this.forkId = forkId;

    define(this, {
      localProps: observable,
      setProps: action,
    });

    // 返回代理对象，实现自动透传
    return new Proxy(this, {
      get: (target: any, prop: PropertyKey, receiver: any) => {
        // disposed check
        if (prop === 'disposed') return target.disposed;

        // 特殊处理 constructor，应该返回 master 的 constructor
        if (prop === 'constructor') {
          return target.master.constructor;
        }
        if (prop === 'props') {
          // 对 props 做合并返回
          return { ...target.master.getProps(), ...target.localProps };
        }
        // fork 自身属性 / 方法优先
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        // 默认取 master 上的值
        const value = (target.master as any)[prop];

        // 如果是函数，需要绑定到 fork 实例，让 this 指向 fork
        // 使用闭包捕获正确的 constructor，避免异步方法中的竞态条件
        if (typeof value === 'function') {
          const masterConstructor = target.master.constructor;
          return function (this: any, ...args: any[]) {
            // 创建一个临时的 this 对象，包含正确的 constructor
            const contextThis = Object.create(this);
            Object.defineProperty(contextThis, 'constructor', {
              value: masterConstructor,
              configurable: true,
              enumerable: false,
              writable: false,
            });

            return value.apply(contextThis, args);
          }.bind(receiver);
        }
        return value;
      },
      set: (target: any, prop: PropertyKey, value: any, receiver: any) => {
        if (prop === 'props') {
          return true;
        }

        // 如果 fork 自带字段，则写到自身（例如 localProps）
        if (prop in target) {
          return Reflect.set(target, prop, value, receiver);
        }

        // 其余写入 master，但需要确保 setter 中的 this 指向 fork
        // 检查 master 上是否有对应的 setter
        const descriptor = this.getPropertyDescriptor(target.master, prop);
        if (descriptor && descriptor.set) {
          // 如果有 setter，直接用 receiver（fork 实例）作为 this 调用
          // 这样 setter 中的 this 就指向 fork，可以正确调用 fork 的方法
          descriptor.set.call(receiver, value);
          return true;
        } else {
          // 没有 setter，直接赋值到 master
          (target.master as any)[prop] = value;
          return true;
        }
      },
    });
  }

  public setSharedContext(ctx: Record<string, any>) {
    this._sharedContext = ctx;
  }

  public getSharedContext() {
    if (this.async || !this.parent) {
      return this._sharedContext;
    }
    return {
      ...this.parent?.getSharedContext(),
      ...this._sharedContext, // 当前实例的 context 优先级最高
    };
  }

  /**
   * 获取对象及其原型链上的属性描述符
   */
  private getPropertyDescriptor(obj: any, prop: PropertyKey): PropertyDescriptor | undefined {
    let current = obj;
    while (current) {
      const descriptor = Object.getOwnPropertyDescriptor(current, prop);
      if (descriptor) {
        return descriptor;
      }
      current = Object.getPrototypeOf(current);
    }
    return undefined;
  }

  /**
   * 修改局部 props，仅影响当前 fork
   */
  setProps(key: string | IModelComponentProps, value?: any): void {
    if (this.disposed) return;

    if (typeof key === 'string') {
      this.localProps[key] = value;
    } else {
      this.localProps = { ...this.localProps, ...key };
    }
  }

  /**
   * render 依旧使用 master 的方法，但合并后的 props 需要透传
   */
  render() {
    if (this.disposed) return null;
    // 将 master.render 以 fork 作为 this 调用，使其读取到合并后的 props
    const mergedProps = { ...this.master.getProps(), ...this.localProps };
    // 临时替换 this.props
    const originalProps = (this as any).props;
    (this as any).props = mergedProps;
    try {
      return (this.master.render as any).call(this);
    } finally {
      (this as any).props = originalProps;
    }
  }

  /**
   * 释放 fork：从 master.forks 中移除自身并断开引用
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.master && (this.master as any).forks) {
      (this.master as any).forks.delete(this as any);
    }
    // 从 master 的 forkCache 中移除自己
    if (this.master && (this.master as any).forkCache) {
      const forkCache = (this.master as any).forkCache;
      for (const [key, fork] of forkCache.entries()) {
        if (fork === this) {
          forkCache.delete(key);
          break;
        }
      }
    }
    // @ts-ignore
    this.master = null;
  }

  /**
   * 获取合并后的 props（master + localProps，local 优先）
   */
  getProps(): IModelComponentProps {
    return { ...this.master.getProps(), ...this.localProps };
  }
}

// 类型断言：让 ForkFlowModel 可以被当作 FlowModel 使用
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ForkFlowModel<TMaster extends FlowModel = FlowModel> extends FlowModel {}
