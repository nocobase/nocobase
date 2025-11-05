/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid as genUid } from 'uid/secure';
import type { FlowEngine } from '../flowEngine';
import type { FlowModel } from '../models/flowModel';

type WhenString = 'created' | 'mounted' | 'ready' | 'unmounted' | 'destroyed' | 'beforeRender:end';

export type ScheduleWhen = WhenString | ((e: LifecycleEvent) => boolean);

export interface ScheduleOptions {
  when?: ScheduleWhen;
  timeoutMs?: number;
}

export interface ScheduledHandle {
  id: string;
  cancel: (reason?: any) => boolean;
  status: () => ScheduledStatus;
}

type ScheduledStatus = 'pending' | 'running' | 'done' | 'cancelled' | 'expired';

export interface LifecycleEvent {
  type: WhenString;
  uid: string;
  model?: FlowModel;
  runId?: string;
  error?: any;
  inputArgs?: Record<string, any>;
  result?: any;
}

// 不再维护生命周期状态表：事件触发即处理，保持最小化。

type ScheduledItem = {
  id: string;
  fromUid: string;
  toUid: string;
  fn: (model: FlowModel) => Promise<void> | void;
  options: ScheduleOptions;
  status: ScheduledStatus;
  timeoutTimer?: ReturnType<typeof setTimeout>;
};

export class ModelOperationScheduler {
  private itemsByTargetUid = new Map<string, Map<string, ScheduledItem>>();
  private itemIdsByFromUid = new Map<string, Set<string>>();
  // 无生命周期缓存：依赖事件触发即时处理
  private itemsById = new Map<string, ScheduledItem>();

  private unbindHandlers: Array<() => void> = [];

  constructor(private engine: FlowEngine) {
    this.bindEngineLifecycle();
  }

  /** 外部调用入口 */
  schedule(
    fromModelOrUid: FlowModel | string,
    toUid: string,
    fn: (model: FlowModel) => Promise<void> | void,
    options?: ScheduleOptions,
  ): ScheduledHandle {
    const fromUid = typeof fromModelOrUid === 'string' ? fromModelOrUid : fromModelOrUid?.uid;
    if (!fromUid) {
      throw new Error('scheduleModelOperation: invalid from model or uid');
    }
    if (!toUid || typeof toUid !== 'string') {
      throw new Error('scheduleModelOperation: invalid target uid');
    }

    const item: ScheduledItem = {
      id: genUid(),
      fromUid,
      toUid,
      fn,
      options: {
        // 默认语义：仅当 when === 'created' 时，对“已存在的目标”进行一次立即执行；
        // 其它 when 不做立即执行，需等待后续真实生命周期事件。
        when: options?.when ?? 'created',
        timeoutMs: options?.timeoutMs,
      },
      status: 'pending',
    };

    // 注册结构
    let targetMap = this.itemsByTargetUid.get(toUid);
    if (!targetMap) {
      targetMap = new Map();
      this.itemsByTargetUid.set(toUid, targetMap);
    }
    targetMap.set(item.id, item);
    let fromSet = this.itemIdsByFromUid.get(fromUid);
    if (!fromSet) {
      fromSet = new Set();
      this.itemIdsByFromUid.set(fromUid, fromSet);
    }
    fromSet.add(item.id);
    this.itemsById.set(item.id, item);

    // 超时自动清理
    if (item.options.timeoutMs && item.options.timeoutMs > 0) {
      item.timeoutTimer = setTimeout(() => {
        if (this.getItem(item.id)?.status === 'pending') {
          this.internalExpire(item.id, 'timeout');
        }
      }, item.options.timeoutMs);
    }

    const modelNow = this.engine.getModel<FlowModel>(toUid);
    if (modelNow && item.options.when === 'created') {
      // 仅 when === 'created' 时，对“已存在的目标”立即执行一次
      void this.tryExecute(item, { type: 'created', uid: toUid, model: modelNow });
    }

    return this.createHandle(item);
  }

  cancel(filter: { fromUid?: string; toUid?: string }) {
    const { fromUid, toUid } = filter || {};
    if (toUid && this.itemsByTargetUid.has(toUid)) {
      const map = this.itemsByTargetUid.get(toUid);
      if (map)
        for (const item of map.values()) {
          if (fromUid && item.fromUid !== fromUid) continue;
          this.internalCancel(item.id, 'cancelled');
        }
      return;
    }
    if (fromUid && this.itemIdsByFromUid.has(fromUid)) {
      const set = this.itemIdsByFromUid.get(fromUid);
      if (set)
        for (const id of Array.from(set)) {
          const it = this.getItem(id);
          if (!it) continue;
          if (toUid && it.toUid !== toUid) continue;
          this.internalCancel(id, 'cancelled');
        }
    }
  }

  /** 引擎关闭时释放（当前场景由 GC 处理，无需显式暴露） */
  dispose() {
    // 解绑生命周期事件监听
    try {
      for (const unbind of this.unbindHandlers) {
        try {
          unbind();
        } catch (err) {
          // 忽略解绑异常
          void err;
        }
      }
    } finally {
      this.unbindHandlers = [];
    }

    // 统一取消剩余任务（将触发 cleanupItem，从而移除 abort 监听与计时器）
    for (const map of this.itemsByTargetUid.values()) {
      for (const item of map.values()) this.internalCancel(item.id, 'disposed');
    }
    this.itemsByTargetUid.clear();
    this.itemIdsByFromUid.clear();
  }

  // ================= 内部实现 =================

  private bindEngineLifecycle() {
    const emitter = this.engine.emitter;
    if (!emitter || typeof emitter.on !== 'function') return;

    const onCreated = (e: LifecycleEvent) => {
      this.processLifecycleEvent(e.uid, { ...e, type: 'created' });
    };
    emitter.on('model:created', onCreated);
    this.unbindHandlers.push(() => emitter.off('model:created', onCreated));

    const onMounted = (e: LifecycleEvent) => {
      this.processLifecycleEvent(e.uid, { ...e, type: 'mounted' });
    };
    emitter.on('model:mounted', onMounted);
    this.unbindHandlers.push(() => emitter.off('model:mounted', onMounted));

    const onBeforeEnd = (e: LifecycleEvent) => {
      // 投递具体事件
      this.processLifecycleEvent(e.uid, { ...e, type: 'beforeRender:end' });
      // 同时提供“就绪”语义（首次与否由监听方自行控制，如有需要）
      this.processLifecycleEvent(e.uid, { ...e, type: 'ready' as const });
    };
    emitter.on('model:beforeRender:end', onBeforeEnd);
    this.unbindHandlers.push(() => emitter.off('model:beforeRender:end', onBeforeEnd));

    const onUnmounted = (e: LifecycleEvent) => {
      this.processLifecycleEvent(e.uid, { ...e, type: 'unmounted' });
    };
    emitter.on('model:unmounted', onUnmounted);
    this.unbindHandlers.push(() => emitter.off('model:unmounted', onUnmounted));

    const onDestroyed = (e: LifecycleEvent) => {
      // 允许在销毁事件上匹配的任务先尝试执行（此时 e.model 仍可用，removeModel 中传入）
      const targetBucket = this.itemsByTargetUid.get(e.uid);
      const event = { ...e, type: 'destroyed' as const };
      const triggered = new Set<string>();
      if (targetBucket && targetBucket.size) {
        for (const item of targetBucket.values()) {
          if (item.status !== 'pending') continue;
          if (this.shouldTrigger(item.options.when, event)) {
            triggered.add(item.id);
            void this.tryExecute(item, event);
          }
        }
      }
      // 在下一轮任务队列中清理“未触发”的目标相关任务，避免和 tryExecute 的并发冲突
      setTimeout(() => {
        const map = this.itemsByTargetUid.get(e.uid);
        if (map) {
          for (const item of Array.from(map.values())) {
            if (!triggered.has(item.id)) this.internalCancel(item.id, 'targetDestroyed');
          }
          if (map.size === 0) this.itemsByTargetUid.delete(e.uid);
        }
        // 无生命周期缓存，略
      }, 0);
    };
    emitter.on('model:destroyed', onDestroyed);
    this.unbindHandlers.push(() => emitter.off('model:destroyed', onDestroyed));
  }

  private processLifecycleEvent(targetUid: string, event: LifecycleEvent) {
    const targetBucket = this.itemsByTargetUid.get(targetUid);
    if (!targetBucket || targetBucket.size === 0) return;
    for (const item of Array.from(targetBucket.values())) {
      if (item.status !== 'pending') continue;
      const should = this.shouldTrigger(item.options.when, event);
      if (!should) continue;
      void this.tryExecute(item, event);
    }
  }

  private shouldTrigger(when: ScheduleWhen | undefined, event: LifecycleEvent): boolean {
    if (!when) return false;
    if (typeof when === 'function') return !!when(event);
    return when === event.type;
  }

  private async tryExecute(item: ScheduledItem, event: LifecycleEvent) {
    const run = async () => {
      if (item.status !== 'pending') return;
      item.status = 'running';
      try {
        const model = event.model || this.engine.getModel<FlowModel>(item.toUid);
        if (!model) {
          // 目标不存在（已销毁或未创建），将其视作取消
          this.internalCancel(item.id, 'noTarget');
          return;
        }
        await Promise.resolve(item.fn(model));
        item.status = 'done';
      } catch (err) {
        // 失败即结束（可靠性由注册者自行保证）
        this.engine.logger?.error?.(
          {
            err,
            id: item.id,
            fromUid: item.fromUid,
            toUid: item.toUid,
            when: item.options.when,
          },
          'ModelOperationScheduler: operation execution failed',
        );
        item.status = 'done';
      } finally {
        // 执行完成后，清除超时计时器，统一清理（一次性语义）
        if (item.timeoutTimer) {
          clearTimeout(item.timeoutTimer);
          item.timeoutTimer = undefined;
        }
        this.cleanupItem(item.id);
      }
    };

    await run();
  }

  private internalCancel(id: string, _reason?: any) {
    const item = this.getItem(id);
    if (!item) return false;
    item.status = 'cancelled';
    if (item.timeoutTimer) clearTimeout(item.timeoutTimer);
    this.cleanupItem(id);
    return true;
  }

  private internalExpire(id: string, _reason?: any) {
    const item = this.getItem(id);
    if (!item) return false;
    item.status = 'expired';
    this.cleanupItem(id);
    return true;
  }

  private cleanupItem(id: string) {
    const it = this.getItem(id);
    if (!it) return;
    const { toUid, fromUid } = it;
    const map = this.itemsByTargetUid.get(toUid);
    if (map) {
      map.delete(id);
      if (map.size === 0) this.itemsByTargetUid.delete(toUid);
    }
    const set = this.itemIdsByFromUid.get(fromUid);
    if (set) {
      set.delete(id);
      if (set.size === 0) this.itemIdsByFromUid.delete(fromUid);
    }
    this.itemsById.delete(id);
    // 清理计时器
    if (it.timeoutTimer) {
      clearTimeout(it.timeoutTimer);
      it.timeoutTimer = undefined;
    }
  }

  private getItem(id: string): ScheduledItem | undefined {
    return this.itemsById.get(id);
  }

  private createHandle(item: ScheduledItem, cancelled = false): ScheduledHandle {
    if (cancelled) item.status = 'cancelled';
    return {
      id: item.id,
      cancel: (reason?: any) => this.internalCancel(item.id, reason),
      status: () => item.status,
    };
  }
}

export default ModelOperationScheduler;
