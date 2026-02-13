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
import { FlowExitAllException } from '../utils/exceptions';

type LifecycleType =
  | 'created'
  | 'mounted'
  | 'unmounted'
  | 'destroyed'
  | `event:${string}:start`
  | `event:${string}:end`
  | `event:${string}:error`;

export type ScheduleWhen = LifecycleType | ((e: LifecycleEvent) => boolean);

export interface ScheduleOptions {
  when?: ScheduleWhen;
}

export type ScheduledCancel = () => boolean;

export interface LifecycleEvent {
  type: LifecycleType;
  uid: string;
  model?: FlowModel;
  runId?: string;
  error?: any;
  inputArgs?: Record<string, any>;
  result?: any;
  flowKey?: string;
  stepKey?: string;
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
  private itemsById = new Map<string, ScheduledItem>();

  private unbindHandlers: Array<() => void> = [];
  private subscribedEventNames = new Set<string>();

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

    // 若是 event:xxx:start/end 语义，确保已订阅对应的 model:event 通道
    this.ensureEventSubscriptionIfNeeded(item.options.when);

    const modelNow = this.engine.getModel<FlowModel>(toUid);
    if (modelNow && item.options.when === 'created') {
      // 仅 when === 'created' 时，对“已存在的目标”立即执行一次
      void this.tryExecuteOnce(item.id, { type: 'created', uid: toUid, model: modelNow });
    }

    return () => this.internalCancel(item.id);
  }

  cancel(filter: { fromUid?: string; toUid?: string }) {
    const { fromUid, toUid } = filter || {};
    if (toUid && this.itemsByTargetUid.has(toUid)) {
      const map = this.itemsByTargetUid.get(toUid);
      if (map)
        for (const item of map.values()) {
          if (fromUid && item.fromUid !== fromUid) continue;
          this.internalCancel(item.id);
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
          this.internalCancel(id);
        }
    }
  }

  /** 引擎关闭时释放 */
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
      for (const item of map.values()) this.internalCancel(item.id);
    }
    this.itemsByTargetUid.clear();
    this.itemIdsByFromUid.clear();
  }

  private bindEngineLifecycle() {
    const emitter = this.engine.emitter;
    if (!emitter || typeof emitter.on !== 'function') return;

    const onCreated = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: 'created' });
    };
    emitter.on('model:created', onCreated);
    this.unbindHandlers.push(() => emitter.off('model:created', onCreated));

    const onMounted = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: 'mounted' });
    };
    emitter.on('model:mounted', onMounted);
    this.unbindHandlers.push(() => emitter.off('model:mounted', onMounted));

    const onGenericBeforeStart = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: 'event:beforeRender:start' });
    };
    emitter.on('model:event:beforeRender:start', onGenericBeforeStart);
    this.unbindHandlers.push(() => emitter.off('model:event:beforeRender:start', onGenericBeforeStart));

    const onGenericBeforeEnd = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: 'event:beforeRender:end' });
    };
    emitter.on('model:event:beforeRender:end', onGenericBeforeEnd);
    this.unbindHandlers.push(() => emitter.off('model:event:beforeRender:end', onGenericBeforeEnd));

    const onUnmounted = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: 'unmounted' });
    };
    emitter.on('model:unmounted', onUnmounted);
    this.unbindHandlers.push(() => emitter.off('model:unmounted', onUnmounted));

    const onDestroyed = async (e: LifecycleEvent) => {
      const targetBucket = this.itemsByTargetUid.get(e.uid);
      const event = { ...e, type: 'destroyed' as const };
      if (targetBucket && targetBucket.size) {
        const ids = Array.from(targetBucket.keys());
        for (const id of ids) {
          const it = this.itemsById.get(id);
          if (!it) continue;
          if (this.shouldTrigger(it.options.when, event)) {
            await this.tryExecuteOnce(id, event);
          } else {
            this.internalCancel(id);
          }
        }
      }
    };
    emitter.on('model:destroyed', onDestroyed);
    this.unbindHandlers.push(() => emitter.off('model:destroyed', onDestroyed));
  }

  private ensureEventSubscriptionIfNeeded(when?: ScheduleWhen) {
    if (!when || typeof when !== 'string') return;
    const parsed = this.parseEventWhen(when);
    if (!parsed) return;
    const { name } = parsed;
    if (this.subscribedEventNames.has(name)) return;
    this.subscribedEventNames.add(name);
    const emitter = this.engine.emitter;
    const onStart = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: `event:${name}:start` as LifecycleType });
    };
    const onEnd = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: `event:${name}:end` as LifecycleType });
    };
    const onError = async (e: LifecycleEvent) => {
      await this.processLifecycleEvent(e.uid, { ...e, type: `event:${name}:error` as LifecycleType });
    };
    emitter.on(`model:event:${name}:start`, onStart);
    emitter.on(`model:event:${name}:end`, onEnd);
    emitter.on(`model:event:${name}:error`, onError);
    this.unbindHandlers.push(() => emitter.off(`model:event:${name}:start`, onStart));
    this.unbindHandlers.push(() => emitter.off(`model:event:${name}:end`, onEnd));
    this.unbindHandlers.push(() => emitter.off(`model:event:${name}:error`, onError));
  }

  private parseEventWhen(when?: ScheduleWhen): { name: string; phase: 'start' | 'end' | 'error' } | null {
    if (!when || typeof when !== 'string') return null;
    const m = /^event:(.+):(start|end|error)$/.exec(when);
    if (!m) return null;
    return { name: m[1], phase: m[2] as 'start' | 'end' | 'error' };
  }

  private async processLifecycleEvent(targetUid: string, event: LifecycleEvent) {
    const targetBucket = this.itemsByTargetUid.get(targetUid);
    if (!targetBucket || targetBucket.size === 0) return;
    const ids = Array.from(targetBucket.keys());
    for (const id of ids) {
      const item = this.itemsById.get(id);
      if (!item) continue;
      const should = this.shouldTrigger(item.options.when, event);
      if (!should) continue;
      await this.tryExecuteOnce(id, event);
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
      if (err instanceof FlowExitAllException) {
        throw err;
      }
      this.engine.logger?.error?.(
        { err, id, fromUid: item.fromUid, toUid: item.toUid, when: item.options.when },
        'ModelOperationScheduler: operation execution failed',
      );
    }
  }

  private internalCancel(id: string) {
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
