/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { FlowEngine, FlowModel, createViewScopedEngine, createBlockScopedEngine } from '..';
import type { LifecycleEvent } from '../scheduler/ModelOperationScheduler';

function newEngine(): FlowEngine {
  const engine = new FlowEngine();
  // 提供最小 api，避免 ctx.auth getter 在打印对象时抛错
  engine.context.defineProperty('api', { value: { auth: { role: 'guest', locale: 'zh-CN', token: '' } } });
  return engine;
}

describe('ModelOperationScheduler', () => {
  it('should execute on ready when beforeRender ends', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-1' });

    const calls: string[] = [];

    engine.scheduleModelOperation(
      from,
      to.uid,
      async (m) => {
        expect(m.uid).toBe(to.uid);
        calls.push('ran');
      },
      { when: 'ready' },
    );

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(calls).toEqual(['ran']);
  });

  it('should execute on mounted when model is mounted via ReactView', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-mount-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-mount-1' });

    const fn = vi.fn();
    const root = engine.reactView.createRoot(document.createElement('div'));
    await act(async () => {
      root.render(to.render());
    });
    // 先触发 mounted，再注册（immediate: always）
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'mounted' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);

    root.unmount();
  });

  it('should execute once for existing target even when when=unmounted', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-unmount-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-unmount-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'unmounted' });

    const root = engine.reactView.createRoot(document.createElement('div'));
    await act(async () => {
      root.render(to.render());
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => {
      root.unmount();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    // once 语义：卸载后不再执行
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support predicate for when', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-pred-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-pred-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, {
      when: (e: LifecycleEvent) => e.type === 'beforeRender:end' && e.uid === to.uid,
    });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not expire when model exists (immediate executes once)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-timeout-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-timeout-1' });

    const handle = engine.scheduleModelOperation(from, to.uid, async () => {}, { when: 'ready', timeoutMs: 10 });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(handle.status()).toBe('done');
  });

  it('should execute once immediately for existing target (beforeRender:end)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-imd-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-imd-1' });

    // make at least one beforeRender completed first
    await engine.executor.dispatchEvent(to, 'beforeRender');

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    // 目标已存在，立即执行一次
    expect(fn).toHaveBeenCalledTimes(1);
    // 之后事件不会再次触发
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // 简化后：dedupe/policy/concurrency 已移除，不再校验

  it('should execute immediately if target already ready', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-2' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-2' });

    // trigger ready first
    await engine.executor.dispatchEvent(to, 'beforeRender');

    const calls: string[] = [];
    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        calls.push('immediate');
      },
      { when: 'ready' },
    );

    // schedule immediate is async; wait a macrotask
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toEqual(['immediate']);
  });

  it('should run only once for beforeRender:end', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-3' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-3' });
    const calls: number[] = [];

    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        calls.push(Date.now());
      },
      { when: 'beforeRender:end', once: true },
    );

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(calls.length).toBe(1);
  });

  it('should run only once for beforeRender:end regardless of events', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-repeat-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-repeat-1' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end' });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    // 已存在立即一次；之后事件不会再次触发
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should still execute once even if source model destroyed later', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-4' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-4' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end' });
    // destroy source before event
    await from.destroy();

    await engine.executor.dispatchEvent(to, 'beforeRender');
    // 简化策略：注册即执行一次，与来源后续生命周期无关
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should trigger on target destroyed', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-5' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-5' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'destroyed' });
    await to.destroy();
    // 等待异步调度执行（销毁场景采用下一轮任务队列清理，稍作等待）
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // replace/serial 顺序校验已移除，不再测试

  it('should schedule via block engine but execute in parent view engine scope', async () => {
    const root = new FlowEngine();
    const view = createViewScopedEngine(root);
    const block = createBlockScopedEngine(view);

    const from = view.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-8' });
    const to = view.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-8' });

    const fn = vi.fn();
    // 调用来源是 block 引擎
    (block as FlowEngine).scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end' });

    // 事件由 view 引擎派发（与 block 调度兼容，调度对象由 view 引擎维护）
    await (view as FlowEngine).executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('executes multiple scheduled callbacks exactly once (immediate + later events)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-multi-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-multi-1' });

    const a = vi.fn();
    const b = vi.fn();
    // 目标已存在：注册后应各自立即执行一次
    engine.scheduleModelOperation(from, to.uid, a, { when: 'mounted' });
    engine.scheduleModelOperation(from, to.uid, b, { when: 'beforeRender:end' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    // 后续生命周期事件不应再次触发
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('expires when target never appears (timeoutMs)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-expire-1' });
    const missingUid = 'to-never-appears-1';

    const fn = vi.fn();
    const handle = engine.scheduleModelOperation(from, missingUid, fn, { when: 'ready', timeoutMs: 15 });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(handle.status()).toBe('expired');
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancelScheduledOperations by fromUid/toUid works and prevents execution', async () => {
    const engine = newEngine();
    const from1 = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-cancel-1' });
    const from2 = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-cancel-2' });
    const to1 = 'to-cancel-1';
    const to2 = 'to-cancel-2';

    const f1 = vi.fn();
    const f2 = vi.fn();
    const f3 = vi.fn();
    const f4 = vi.fn();

    const h1 = engine.scheduleModelOperation(from1, to1, f1, { when: 'created' });
    const h2 = engine.scheduleModelOperation(from1, to2, f2, { when: 'created' });
    const h3 = engine.scheduleModelOperation(from2, to1, f3, { when: 'created' });
    const h4 = engine.scheduleModelOperation(from2, to2, f4, { when: 'created' });

    // 取消 from1 的全部
    engine.cancelScheduledOperations({ fromUid: from1.uid });
    expect(h1.status()).toBe('cancelled');
    expect(h2.status()).toBe('cancelled');

    // 创建目标 to1，仅 h3 应触发；h4 仍待定
    engine.createModel<FlowModel>({ use: 'FlowModel', uid: to1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(f3).toHaveBeenCalledTimes(1);
    expect(h3.status()).toBe('done');

    // 取消剩余 to2
    engine.cancelScheduledOperations({ toUid: to2 });
    expect(h4.status()).toBe('cancelled');
    expect(f4).not.toHaveBeenCalled();
  });

  it('on target destroyed: only destroyed-matching executes; others are cancelled', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-destroy-1' });
    const toUid = 'to-destroy-1';

    const onDestroyed = vi.fn();
    const onReady = vi.fn();
    const onMounted = vi.fn();

    const h1 = engine.scheduleModelOperation(from, toUid, onDestroyed, { when: 'destroyed' });
    const h2 = engine.scheduleModelOperation(from, toUid, onReady, { when: 'ready' });
    const h3 = engine.scheduleModelOperation(from, toUid, onMounted, { when: 'mounted' });

    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: toUid });
    await to.destroy();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onDestroyed).toHaveBeenCalledTimes(1);
    expect(h1.status()).toBe('done');

    expect(onReady).not.toHaveBeenCalled();
    expect(onMounted).not.toHaveBeenCalled();
    expect(h2.status()).toBe('cancelled');
    expect(h3.status()).toBe('cancelled');
  });
});
