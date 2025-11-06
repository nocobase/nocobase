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
  it("should execute on 'event:beforeRender:end' when beforeRender ends", async () => {
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
      { when: 'event:beforeRender:end' },
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
    // 先注册，再触发 mounted 事件
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'mounted' });
    await act(async () => {
      root.render(to.render());
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);

    root.unmount();
  });

  it("should execute on generic event start ('event:foo:start')", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-evt-start-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-evt-start-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:foo:start' });

    // 触发自定义事件 'foo'，调度器监听到 model:event:foo:start 后应执行一次
    await engine.executor.dispatchEvent(to, 'foo');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should execute on generic event end ('event:foo:end')", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-evt-end-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-evt-end-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:foo:end' });

    // 触发自定义事件 'foo'，应在事件结束后执行一次
    await engine.executor.dispatchEvent(to, 'foo');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should execute on generic event error ('event:foo:error')", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-evt-error-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-evt-error-1' });

    // 注册一个在 foo 事件下执行并抛错的 flow（顺序执行以抛出到外层）
    to.flowRegistry.addFlows({
      failOnFoo: {
        on: { eventName: 'foo' },
        steps: {
          s1: {
            title: 'throw',
            handler: () => {
              throw new Error('boom');
            },
          },
        },
      },
    });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:foo:error' });

    await engine.executor.dispatchEvent(to, 'foo', {}, { sequential: true });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute on unmounted when model is unmounted (no immediate)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-unmount-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-unmount-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'unmounted' });

    const root = engine.reactView.createRoot(document.createElement('div'));
    await act(async () => {
      root.render(to.render());
    });
    // 挂载后不会立即执行（等待卸载事件）
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(0);
    await act(async () => {
      root.unmount();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should support predicate for when', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-pred-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-pred-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, {
      when: (e: LifecycleEvent) => e.type === 'event:beforeRender:end' && e.uid === to.uid,
    });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute once when beforeRender ends (no immediate for existing target)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-imd-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-imd-1' });

    const fn = vi.fn();
    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:beforeRender:end' });
    // 触发一次 beforeRender:end
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should execute immediately when target already exists and when='created'", async () => {
    const engine = newEngine();
    // 先创建目标模型
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-created-immediate' });
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-created-immediate' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'created' });
    // 目标已存在，应在注册后立即执行一次
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // 简化后：dedupe/policy/concurrency 已移除，不再校验

  it("should execute when 'event:beforeRender:end' after beforeRender ends (no immediate)", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-2' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-2' });

    const calls: string[] = [];
    engine.scheduleModelOperation(
      from,
      to.uid,
      async () => {
        calls.push('end');
      },
      { when: 'event:beforeRender:end' },
    );

    // 触发 beforeRender:end
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toEqual(['end']);
  });

  it("should run only once for 'event:beforeRender:end'", async () => {
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
      { when: 'event:beforeRender:end' },
    );

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await engine.executor.dispatchEvent(to, 'beforeRender');
    expect(calls.length).toBe(1);
  });

  it("should run only once for 'event:beforeRender:end' regardless of events", async () => {
    const engine = new FlowEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-repeat-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-repeat-1' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:beforeRender:end' });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should remove scheduled item after execution (cancel returns false)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-auto-remove-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-auto-remove-1' });

    const fn = vi.fn();
    const cancel = engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:beforeRender:end' });

    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
    // 执行完成后应自动移除，再次取消应返回 false
    expect(cancel()).toBe(false);
  });

  it('should still execute once even if source model destroyed later', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-4' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-4' });
    const fn = vi.fn();

    engine.scheduleModelOperation(from, to.uid, fn, { when: 'event:beforeRender:end' });
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
    (block as FlowEngine).scheduleModelOperation(from, to.uid, fn, { when: 'event:beforeRender:end' });

    // 事件由 view 引擎派发（与 block 调度兼容，调度对象由 view 引擎维护）
    await (view as FlowEngine).executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('executes multiple scheduled callbacks exactly once (after events)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-multi-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-multi-1' });

    const a = vi.fn();
    const b = vi.fn();
    // 先注册，再触发事件
    engine.scheduleModelOperation(from, to.uid, a, { when: 'mounted' });
    engine.scheduleModelOperation(from, to.uid, b, { when: 'event:beforeRender:end' });

    const root = engine.reactView.createRoot(document.createElement('div'));
    await act(async () => {
      root.render(to.render()); // 触发 mounted
    });
    await engine.executor.dispatchEvent(to, 'beforeRender'); // 触发 beforeRender:end
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('on target destroyed: only destroyed-matching executes; others are cancelled', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-destroy-1' });
    const toUid = 'to-destroy-1';

    const onDestroyed = vi.fn();
    const onEnd = vi.fn();
    const onMounted = vi.fn();

    const cd = engine.scheduleModelOperation(from, toUid, onDestroyed, { when: 'destroyed' });
    const cr = engine.scheduleModelOperation(from, toUid, onEnd, { when: 'event:beforeRender:end' });
    const cm = engine.scheduleModelOperation(from, toUid, onMounted, { when: 'mounted' });

    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: toUid });
    await to.destroy();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onDestroyed).toHaveBeenCalledTimes(1);
    expect(cd()).toBe(false);

    expect(onEnd).not.toHaveBeenCalled();
    expect(onMounted).not.toHaveBeenCalled();
    expect(cr()).toBe(false);
    expect(cm()).toBe(false);
  });
});
