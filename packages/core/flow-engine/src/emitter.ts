/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type EventsMap = Record<string, unknown>;

export class Emitter<E extends EventsMap = Record<string, unknown>> {
  // 事件名 -> 监听器数组（内部存储使用 unknown，类型由方法签名保证）
  private events: Record<string, Array<(payload: unknown) => void>> = Object.create(null);
  private paused = false;
  // tag -> set of off callbacks (for grouped cleanup)
  private tagMap: Map<string, Set<() => void>> = new Map();
  // event -> (callback -> set of off refs)（用于手动 off 时同步清理 tagMap 中的 off 引用）
  private callbackRefMap: Map<string, Map<(payload: unknown) => void, Set<() => void>>> = new Map();

  // TODO: this was used only by replaceModel, better find a new approach and remove this
  setPaused(paused: boolean) {
    this.paused = paused;
  }

  /**
   * 订阅事件
   * 返回一个 off 函数用于取消订阅（兼容旧用法：直接调用 on 也可，不强制使用返回值）。
   */
  // overloads for typed和通用用法
  on<K extends keyof E>(event: K, callback: (payload: E[K]) => void, options?: { tag?: string }): () => void;
  on(event: string, callback: (payload: any) => void, options?: { tag?: string }): () => void;
  on(event: string, callback: (payload: any) => void, options?: { tag?: string }) {
    const key = String(event);
    (this.events[key] ||= []).push(callback as (payload: unknown) => void);
    const off = () => this._offRaw(key, callback as (payload: unknown) => void);
    // 记录 off 引用，便于后续 off 时同步从 tagMap 清理
    let inner = this.callbackRefMap.get(key);
    if (!inner) {
      inner = new Map();
      this.callbackRefMap.set(key, inner);
    }
    let offSet = inner.get(callback as (payload: unknown) => void);
    if (!offSet) {
      offSet = new Set();
      inner.set(callback as (payload: unknown) => void, offSet);
    }
    offSet.add(off);
    const tag = options?.tag;
    if (tag) {
      let set = this.tagMap.get(tag);
      if (!set) {
        set = new Set();
        this.tagMap.set(tag, set);
      }
      set.add(off);
    }
    return off;
  }

  /**
   * 仅订阅一次，触发后自动移除
   */
  once<K extends keyof E>(event: K, callback: (payload: E[K]) => void, options?: { tag?: string }): () => void;
  once(event: string, callback: (payload: any) => void, options?: { tag?: string }): () => void;
  once(event: string, callback: (payload: any) => void, options?: { tag?: string }) {
    const off = this.on(
      event as keyof E,
      (payload: unknown) => {
        try {
          (callback as (payload: unknown) => void)(payload);
        } finally {
          off?.();
        }
      },
      options,
    );
    return off;
  }

  off<K extends keyof E>(event: K, callback: (payload: E[K]) => void): void;
  off(event: string, callback: (payload: any) => void): void;
  off(event: string | keyof E, callback: (payload: any) => void) {
    const key = String(event);
    this._offRaw(key, callback as (payload: unknown) => void);
  }

  private _offRaw(eventKey: string, callback: (payload: unknown) => void) {
    const arr = this.events[eventKey] || [];
    this.events[eventKey] = arr.filter((fn) => fn !== callback);
    // 同步移除 tagMap 中与该 (event, callback) 关联的 off 引用
    const inner = this.callbackRefMap.get(eventKey);
    if (inner) {
      const offSet = inner.get(callback);
      if (offSet) {
        // 从所有 tag 的 set 中删除这些 off 引用
        for (const tagSet of this.tagMap.values()) {
          for (const offRef of offSet) {
            tagSet.delete(offRef);
          }
        }
        inner.delete(callback);
      }
      if (inner.size === 0) {
        this.callbackRefMap.delete(eventKey);
      }
    }
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void;
  emit(event: string, payload?: any): void;
  emit(event: string | keyof E, payload?: any) {
    if (this.paused) {
      return;
    }
    const key = String(event);
    // 复制一份，避免回调内部 off 影响本次遍历
    (this.events[key] || []).slice().forEach((fn) => fn(payload));
  }

  /**
   * Off all listeners that were registered with the given tag.
   */
  offByTag(tag: string) {
    const set = this.tagMap.get(tag);
    if (!set) return;
    set.forEach((off) => {
      off?.();
    });
    this.tagMap.delete(tag);
  }
}
