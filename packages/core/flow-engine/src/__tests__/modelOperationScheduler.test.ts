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

  it('should execute immediately for existing target and also on unmounted when once=false', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-unmount-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-unmount-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'unmounted', once: false });

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
    // 卸载时再次触发（once=false）
    expect(fn).toHaveBeenCalledTimes(2);
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

  it('should respect immediate:"never" and run on next event', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-imd-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-imd-1' });

    // make at least one beforeRender completed first
    await engine.executor.dispatchEvent(to, 'beforeRender');

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end', immediate: 'never' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(0);

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should drop duplicate when policy is drop', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-drop-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-drop-1' });
    const calls: string[] = [];

    engine.scheduleModelOperation(from, to.uid, async () => calls.push('first'), {
      when: 'beforeRender:end',
      dedupeKey: 'k1',
      policy: 'drop',
    });
    engine.scheduleModelOperation(from, to.uid, async () => calls.push('second'), {
      when: 'beforeRender:end',
      dedupeKey: 'k1',
      policy: 'drop',
    });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(calls).toEqual(['first']);
  });

  it('should run both when concurrency is parallel', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-par-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-par-1' });
    const calls: string[] = [];

    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        calls.push('a');
      },
      { when: 'beforeRender:end', concurrency: 'parallel' },
    );

    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        calls.push('b');
      },
      { when: 'beforeRender:end', concurrency: 'parallel' },
    );

    await engine.executor.dispatchEvent(to, 'beforeRender');
    // 不要求顺序，只需两次均执行
    expect(calls.sort()).toEqual(['a', 'b']);
  });

  it('should execute immediately if target already ready', async () => {
    const engine = new FlowEngine();
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

  it('should run only once when once=true for beforeRender:end', async () => {
    const engine = new FlowEngine();
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

  it('should run repeatedly when once=false for beforeRender:end (including immediate for existing)', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-repeat-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-repeat-1' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end', once: false });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    // 已存在立即一次 + 两次 beforeRender:end
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should cancel when source model destroyed', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-4' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-4' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'beforeRender:end' });
    // destroy source before event
    await from.destroy();

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should trigger on target destroyed', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-5' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-5' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'destroyed' });
    await to.destroy();
    // 等待异步调度执行（销毁场景采用下一轮任务队列清理，稍作等待）
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should replace previous scheduled with same dedupeKey', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-6' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-6' });
    const calls: string[] = [];

    engine.scheduleModelOperation(from, to.uid, async () => calls.push('old'), {
      when: 'beforeRender:end',
      dedupeKey: 'k1',
      policy: 'replace',
    });
    engine.scheduleModelOperation(from, to.uid, async () => calls.push('new'), {
      when: 'beforeRender:end',
      dedupeKey: 'k1',
      policy: 'replace',
    });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(calls).toEqual(['new']);
  });

  it('should run in serial for same target', async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-7' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-7' });
    const order: string[] = [];

    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        order.push('first-start');
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push('first-end');
      },
      { when: 'beforeRender:end', concurrency: 'serial' },
    );

    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        order.push('second');
      },
      { when: 'beforeRender:end', concurrency: 'serial' },
    );

    await engine.executor.dispatchEvent(to, 'beforeRender');
    // 串行第一个包含 10ms 延时，等待所有计划执行完成
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(order).toEqual(['first-start', 'first-end', 'second']);
  });

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
});
