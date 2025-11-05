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
}

export type ScheduledCancel = (reason?: any) => boolean;

export interface LifecycleEvent {
  type: WhenString;
  uid: string;
  model?: FlowModel;
  runId?: string;
  error?: any;
  inputArgs?: Record<string, any>;
  result?: any;
}

type ScheduledItem = {
  id: string;
  fromUid: string;
  toUid: string;
  fn: (model: FlowModel) => Promise<void> | void;
  options: ScheduleOptions;
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
  ): ScheduledCancel {
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
      },
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

    const modelNow = this.engine.getModel<FlowModel>(toUid);
    if (modelNow && item.options.when === 'created') {
      // 仅 when === 'created' 时，对“已存在的目标”立即执行一次
      void this.tryExecuteOnce(item.id, { type: 'created', uid: toUid, model: modelNow });
    }

    return (reason?: any) => this.internalCancel(item.id, reason);
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
          const it = this.itemsById.get(id);
          if (!it) continue;
          if (toUid && it.toUid !== toUid) continue;
          this.internalCancel(id, 'cancelled');
        }
    }
  }

  /** 引擎关闭时释放（当前场景由 GC 处理，无需显式暴露） */
  dispose() {
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
      const targetBucket = this.itemsByTargetUid.get(e.uid);
      const event = { ...e, type: 'destroyed' as const };
      if (targetBucket && targetBucket.size) {
        const ids = Array.from(targetBucket.keys());
        for (const id of ids) {
          const it = this.itemsById.get(id);
          if (!it) continue;
          if (this.shouldTrigger(it.options.when, event)) {
            void this.tryExecuteOnce(id, event);
          } else {
            this.internalCancel(id, 'targetDestroyed');
          }
        }
      }
    };
    emitter.on('model:destroyed', onDestroyed);
    this.unbindHandlers.push(() => emitter.off('model:destroyed', onDestroyed));
  }

  private processLifecycleEvent(targetUid: string, event: LifecycleEvent) {
    const targetBucket = this.itemsByTargetUid.get(targetUid);
    if (!targetBucket || targetBucket.size === 0) return;
    const ids = Array.from(targetBucket.keys());
    for (const id of ids) {
      const item = this.itemsById.get(id);
      if (!item) continue;
      const should = this.shouldTrigger(item.options.when, event);
      if (!should) continue;
      void this.tryExecuteOnce(id, event);
    }
  }

  private shouldTrigger(when: ScheduleWhen | undefined, event: LifecycleEvent): boolean {
    if (!when) return false;
    if (typeof when === 'function') return !!when(event);
    return when === event.type;
  }

  private async tryExecuteOnce(id: string, event: LifecycleEvent) {
    const item = this.takeItem(id);
    if (!item) return;
    try {
      const model = event.model || this.engine.getModel<FlowModel>(item.toUid);
      if (!model) return;
      await Promise.resolve(item.fn(model));
    } catch (err) {
      this.engine.logger?.error?.(
        { err, id, fromUid: item.fromUid, toUid: item.toUid, when: item.options.when },
        'ModelOperationScheduler: operation execution failed',
      );
    }
  }

  private internalCancel(id: string, _reason?: any) {
    return !!this.takeItem(id);
  }

  private takeItem(id: string): ScheduledItem | undefined {
    const it = this.itemsById.get(id);
    if (!it) return undefined;
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
    return it;
  }
}

export default ModelOperationScheduler;
