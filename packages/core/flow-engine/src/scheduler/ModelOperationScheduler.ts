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

type WhenString =
  | 'created'
  | 'mounted'
  | 'ready'
  | 'unmounted'
  | 'destroyed'
  | 'beforeRender:start'
  | 'beforeRender:end';

export type ScheduleWhen = WhenString | ((e: LifecycleEvent) => boolean);

export interface ScheduleOptions {
  when?: ScheduleWhen;
  once?: boolean;
  immediate?: 'never' | 'ifReached';
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  dedupeKey?: string;
  policy?: 'enqueue' | 'replace' | 'drop';
  concurrency?: 'serial' | 'parallel';
}

export interface ScheduledHandle {
  id: string;
  cancel: (reason?: any) => boolean;
  status: () => ScheduledStatus;
  toJSON: () => any;
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

type ModelState = {
  created?: boolean;
  mounted?: boolean;
  ready?: boolean; // first beforeRender:end reached
  unmounted?: boolean;
  destroyed?: boolean;
};

type ScheduledItem = {
  id: string;
  fromUid: string;
  toUid: string;
  fn: (model: FlowModel) => Promise<void> | void;
  options: Required<Pick<ScheduleOptions, 'once' | 'immediate' | 'policy' | 'concurrency'>> &
    Omit<ScheduleOptions, 'once' | 'immediate' | 'policy' | 'concurrency'>;
  status: ScheduledStatus;
  createdAt: number;
  timeoutTimer?: ReturnType<typeof setTimeout>;
  abortCleanup?: () => void;
};

export class ModelOperationScheduler {
  private byTarget = new Map<string, Map<string, ScheduledItem>>();
  private byFrom = new Map<string, Set<string>>();
  private modelState = new Map<string, ModelState>();
  private runningLocks = new Map<string, Promise<void>>(); // per-target serial lock
  private byId = new Map<string, ScheduledItem>();

  private listenersBound = false;
  private unbinds: Array<() => void> = [];

  constructor(private engine: FlowEngine) {
    this.bindEngineLifecycle();
    // 初始化：从现有模型上读取轻量标记（created/mounted/ready）
    try {
      this.engine.forEachModel<FlowModel>((m) => {
        const state: ModelState = {
          created: true,
          mounted: m.isMounted === true,
          ready: m.isReady === true,
        };
        this.modelState.set(m.uid, state);
      });
    } catch (err) {
      // 容错：若无法读取，跳过初始化但记录警告，避免完全静默
      this.engine.logger?.warn?.({ err }, 'ModelOperationScheduler: initialize model state failed');
    }
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
        when: options?.when,
        once: options?.once !== false,
        immediate: options?.immediate ?? 'ifReached',
        timeoutMs: options?.timeoutMs,
        abortSignal: options?.abortSignal,
        dedupeKey: options?.dedupeKey,
        policy: options?.policy ?? 'replace',
        concurrency: options?.concurrency ?? 'serial',
      },
      status: 'pending',
      createdAt: Date.now(),
    };

    // 去重策略：同 target + from + dedupeKey
    if (item.options.dedupeKey) {
      const exist = this.byTarget.get(toUid);
      if (exist) {
        const sameKeys = Array.from(exist.values()).filter(
          (x) => x.fromUid === fromUid && x.options.dedupeKey === item.options.dedupeKey,
        );
        if (sameKeys.length) {
          if (item.options.policy === 'drop') {
            return this.createHandle(item, true);
          }
          if (item.options.policy === 'replace') {
            sameKeys.forEach((x) => this.internalCancel(x.id, 'replaced'));
          }
          // enqueue 则保留
        }
      }
    }

    // 注册结构
    let targetMap = this.byTarget.get(toUid);
    if (!targetMap) {
      targetMap = new Map();
      this.byTarget.set(toUid, targetMap);
    }
    targetMap.set(item.id, item);
    let fromSet = this.byFrom.get(fromUid);
    if (!fromSet) {
      fromSet = new Set();
      this.byFrom.set(fromUid, fromSet);
    }
    fromSet.add(item.id);
    this.byId.set(item.id, item);

    // 监听外部取消
    if (item.options.abortSignal) {
      const signal = item.options.abortSignal;
      const onAbort = () => this.internalCancel(item.id, 'aborted');
      if (signal.aborted) onAbort();
      else {
        signal.addEventListener('abort', onAbort, { once: true });
        item.abortCleanup = () => {
          try {
            signal.removeEventListener('abort', onAbort);
          } catch (err) {
            // 忽略移除监听的异常
            void err;
          }
        };
      }
    }

    // 超时自动清理
    if (item.options.timeoutMs && item.options.timeoutMs > 0) {
      item.timeoutTimer = setTimeout(() => {
        if (this.getItem(item.id)?.status === 'pending') {
          this.internalExpire(item.id, 'timeout');
        }
      }, item.options.timeoutMs);
    }

    // immediate: 若条件已达成，立即尝试触发
    if (item.options.immediate !== 'never') {
      const st = this.modelState.get(toUid);
      if (st && this.hasReached(st, item.options.when)) {
        // 直接触发一次
        void this.tryExecute(item, { type: 'ready', uid: toUid });
        if (item.options.once) {
          // 立即触发 once 任务后，若已结束，会被清理；若执行中仍保留，结束后清理
        }
      }
    }

    return this.createHandle(item);
  }

  cancel(filter: { fromUid?: string; toUid?: string; dedupeKey?: string }) {
    const { fromUid, toUid, dedupeKey } = filter || {};
    if (toUid && this.byTarget.has(toUid)) {
      const map = this.byTarget.get(toUid);
      if (map)
        for (const item of map.values()) {
          if (fromUid && item.fromUid !== fromUid) continue;
          if (dedupeKey && item.options.dedupeKey !== dedupeKey) continue;
          this.internalCancel(item.id, 'cancelled');
        }
      return;
    }
    if (fromUid && this.byFrom.has(fromUid)) {
      const set = this.byFrom.get(fromUid);
      if (set)
        for (const id of Array.from(set)) {
          const it = this.getItem(id);
          if (!it) continue;
          if (toUid && it.toUid !== toUid) continue;
          if (dedupeKey && it.options.dedupeKey !== dedupeKey) continue;
          this.internalCancel(id, 'cancelled');
        }
    }
  }

  /** 引擎关闭时释放（当前场景由 GC 处理，无需显式暴露） */
  dispose() {
    // 解绑生命周期事件监听
    try {
      for (const unbind of this.unbinds) {
        try {
          unbind();
        } catch (err) {
          // 忽略解绑异常
          void err;
        }
      }
    } finally {
      this.unbinds = [];
      this.listenersBound = false;
    }

    // 统一取消剩余任务（将触发 cleanupItem，从而移除 abort 监听与计时器）
    for (const map of this.byTarget.values()) {
      for (const item of map.values()) this.internalCancel(item.id, 'disposed');
    }
    this.byTarget.clear();
    this.byFrom.clear();
    this.modelState.clear();
    this.runningLocks.clear();
  }

  // ================= 内部实现 =================

  private bindEngineLifecycle() {
    if (this.listenersBound) return;
    this.listenersBound = true;

    const emitter = this.engine.emitter;
    if (!emitter || typeof emitter.on !== 'function') return;

    const onCreated = (e: LifecycleEvent) => {
      const st = this.ensureState(e.uid);
      st.created = true;
      this.processEvent(e.uid, { ...e, type: 'created' });
    };
    emitter.on('model:created', onCreated);
    this.unbinds.push(() => emitter.off('model:created', onCreated));

    const onMounted = (e: LifecycleEvent) => {
      const st = this.ensureState(e.uid);
      st.mounted = true;
      this.processEvent(e.uid, { ...e, type: 'mounted' });
    };
    emitter.on('model:mounted', onMounted);
    this.unbinds.push(() => emitter.off('model:mounted', onMounted));

    const onBeforeStart = (e: LifecycleEvent) => {
      this.ensureState(e.uid);
      this.processEvent(e.uid, { ...e, type: 'beforeRender:start' });
    };
    emitter.on('model:beforeRender:start', onBeforeStart);
    this.unbinds.push(() => emitter.off('model:beforeRender:start', onBeforeStart));

    const onBeforeEnd = (e: LifecycleEvent) => {
      const st = this.ensureState(e.uid);
      const firstReady = !st.ready;
      st.ready = true;
      // 先投递具体事件
      this.processEvent(e.uid, { ...e, type: 'beforeRender:end' });
      // 再针对首次 ready 投递一次 ready 语义
      if (firstReady) this.processEvent(e.uid, { ...e, type: 'ready' as const });
    };
    emitter.on('model:beforeRender:end', onBeforeEnd);
    this.unbinds.push(() => emitter.off('model:beforeRender:end', onBeforeEnd));

    const onUnmounted = (e: LifecycleEvent) => {
      const st = this.ensureState(e.uid);
      st.unmounted = true;
      this.processEvent(e.uid, { ...e, type: 'unmounted' });
    };
    emitter.on('model:unmounted', onUnmounted);
    this.unbinds.push(() => emitter.off('model:unmounted', onUnmounted));

    const onDestroyed = (e: LifecycleEvent) => {
      const st = this.ensureState(e.uid);
      st.destroyed = true;
      // 先同步清理“以该 uid 作为来源（fromUid）的任务”，避免后续其它事件（如 beforeRender:end）抢先执行
      const fromSet = this.byFrom.get(e.uid);
      if (fromSet) {
        for (const id of Array.from(fromSet)) this.internalCancel(id, 'sourceDestroyed');
        if (fromSet.size === 0) this.byFrom.delete(e.uid);
      }

      // 允许在销毁事件上匹配的任务先尝试执行（此时 e.model 仍可用，removeModel 中传入）
      const bucket = this.byTarget.get(e.uid);
      const evt = { ...e, type: 'destroyed' as const };
      const triggered = new Set<string>();
      if (bucket && bucket.size) {
        for (const item of bucket.values()) {
          if (item.status !== 'pending') continue;
          if (this.shouldTrigger(item.options.when, evt)) {
            triggered.add(item.id);
            void this.tryExecute(item, evt);
          }
        }
      }
      // 在下一轮任务队列中清理“未触发”的目标相关任务，避免和 tryExecute 的并发冲突
      setTimeout(() => {
        const map = this.byTarget.get(e.uid);
        if (map) {
          for (const item of Array.from(map.values())) {
            if (!triggered.has(item.id)) this.internalCancel(item.id, 'targetDestroyed');
          }
          if (map.size === 0) this.byTarget.delete(e.uid);
        }
        // 最后移除状态
        this.modelState.delete(e.uid);
      }, 0);
    };
    emitter.on('model:destroyed', onDestroyed);
    this.unbinds.push(() => emitter.off('model:destroyed', onDestroyed));
  }

  private ensureState(uid: string): ModelState {
    let st = this.modelState.get(uid);
    if (!st) {
      st = {};
      this.modelState.set(uid, st);
    }
    return st;
  }

  private processEvent(toUid: string, evt: LifecycleEvent) {
    const bucket = this.byTarget.get(toUid);
    if (!bucket || bucket.size === 0) return;
    for (const item of Array.from(bucket.values())) {
      if (item.status !== 'pending') continue;
      const should = this.shouldTrigger(item.options.when, evt);
      if (!should) continue;
      void this.tryExecute(item, evt);
      if (item.options.once) {
        // 如果 once，在执行完成后会被清理；此处先标记，防止同一个事件多次命中
        // 不提前删除，避免并发条件下丢失句柄；改为在完成后 clean
      }
    }
  }

  private hasReached(st: ModelState, when?: ScheduleWhen): boolean {
    if (!when) return false;
    const key = typeof when === 'string' ? when : undefined;
    if (!key) return false; // 函数谓词不支持 immediate 判定
    switch (key) {
      case 'created':
        return !!st.created;
      case 'mounted':
        return !!st.mounted;
      case 'ready':
        return !!st.ready;
      case 'unmounted':
        return !!st.unmounted;
      case 'destroyed':
        return !!st.destroyed;
      default:
        return false; // beforeRender:* 不做 immediate
    }
  }

  private shouldTrigger(when: ScheduleWhen | undefined, evt: LifecycleEvent): boolean {
    if (!when) return false;
    if (typeof when === 'function') return !!when(evt);
    return when === evt.type;
  }

  private async tryExecute(item: ScheduledItem, evt: LifecycleEvent) {
    const run = async () => {
      if (item.status !== 'pending') return;
      item.status = 'running';
      try {
        const model = evt.model || this.engine.getModel<FlowModel>(item.toUid);
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
            dedupeKey: item.options.dedupeKey,
          },
          'ModelOperationScheduler: operation execution failed',
        );
        item.status = 'done';
      } finally {
        // 执行完成后，清除超时计时器，避免非 once 任务后续被误判为超时
        if (item.timeoutTimer) {
          clearTimeout(item.timeoutTimer);
          item.timeoutTimer = undefined;
        }
        // once 任务执行完成后清理；非 once 任务回到等待状态
        if (item.options.once) this.cleanupItem(item.id);
        else item.status = 'pending';
      }
    };

    if (item.options.concurrency === 'serial') {
      const prev = this.runningLocks.get(item.toUid) || Promise.resolve();
      const next = prev
        .then(run)
        .catch((err) => {
          // 理论上 run 不会抛错；如发生，记录日志便于排查
          this.engine.logger?.error?.(
            { err, toUid: item.toUid },
            'ModelOperationScheduler: serial lock execution error',
          );
        })
        .finally(() => {
          if (this.runningLocks.get(item.toUid) === next) this.runningLocks.delete(item.toUid);
        });
      this.runningLocks.set(item.toUid, next);
      await next;
    } else {
      await run();
    }
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
    const map = this.byTarget.get(toUid);
    if (map) {
      map.delete(id);
      if (map.size === 0) this.byTarget.delete(toUid);
    }
    const set = this.byFrom.get(fromUid);
    if (set) {
      set.delete(id);
      if (set.size === 0) this.byFrom.delete(fromUid);
    }
    this.byId.delete(id);
    // 清理计时器与 abort 监听
    if (it.timeoutTimer) {
      clearTimeout(it.timeoutTimer);
      it.timeoutTimer = undefined;
    }
    if (it.abortCleanup) {
      try {
        it.abortCleanup();
      } finally {
        it.abortCleanup = undefined;
      }
    }
  }

  private getItem(id: string): ScheduledItem | undefined {
    return this.byId.get(id);
  }

  private createHandle(item: ScheduledItem, cancelled = false): ScheduledHandle {
    if (cancelled) item.status = 'cancelled';
    return {
      id: item.id,
      cancel: (reason?: any) => this.internalCancel(item.id, reason),
      status: () => item.status,
      toJSON: () => ({ ...item, fn: undefined }),
    };
  }
}

export default ModelOperationScheduler;
