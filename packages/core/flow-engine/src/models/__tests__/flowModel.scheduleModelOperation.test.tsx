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
import { FlowEngine, FlowModel } from '../..';

function newEngine(): FlowEngine {
  const engine = new FlowEngine();
  // 提供最小 api，避免 ctx.auth getter 在测试输出时抛错
  engine.context.defineProperty('api', { value: { auth: { role: 'guest', locale: 'zh-CN', token: '' } } });
  return engine;
}

describe('FlowModel scheduleModelOperation cross-model (target not created yet)', () => {
  it('should apply modification when target is created (when: created)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-created-1' });
    const targetUid = 'to-created-1';

    engine.scheduleModelOperation(
      from,
      targetUid,
      async (m) => {
        m.setProps('foo', 'bar');
      },
      { when: 'created' },
    );

    // 尚未创建目标，先验证未执行
    expect(engine.getModel(targetUid)).toBeUndefined();

    // 创建目标模型，触发 created 事件
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: targetUid });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(to.getProps().foo).toBe('bar');
  });

  it('should apply modification when target is mounted (when: mounted)', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-mounted-1' });
    const targetUid = 'to-mounted-1';

    engine.scheduleModelOperation(
      from,
      targetUid,
      async (m) => {
        m.setProps('mountedMark', true);
      },
      { when: 'mounted' },
    );

    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: targetUid });
    const root = engine.reactView.createRoot(document.createElement('div'));
    await act(async () => {
      root.render(to.render());
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(to.getProps().mountedMark).toBe(true);
    root.unmount();
  });

  it("should apply modification when beforeRender ends (when: 'event:beforeRender:end')", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-ready-1' });
    const targetUid = 'to-ready-1';

    engine.scheduleModelOperation(
      from,
      targetUid,
      async (m) => {
        m.setProps('readyMark', 'done');
      },
      { when: 'event:beforeRender:end' },
    );

    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: targetUid });
    // 触发 beforeRender 完成
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(to.getProps().readyMark).toBe('done');
  });

  it("model.scheduleModelOperation proxies engine and runs on 'event:beforeRender:end'", async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-model-proxy-1' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-model-proxy-1' });

    const fn = vi.fn();
    from.scheduleModelOperation(to.uid, fn, { when: 'event:beforeRender:end' });
    await engine.executor.dispatchEvent(to, 'beforeRender');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("model.scheduleModelOperation triggers immediately on 'created' when target exists", async () => {
    const engine = newEngine();
    const target = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-model-proxy-created' });
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-model-proxy-created' });

    const fn = vi.fn();
    from.scheduleModelOperation(target.uid, fn, { when: 'created' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('model.scheduleModelOperation delegates to engine.scheduleModelOperation', async () => {
    const engine = newEngine();
    const from = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'from-model-proxy-delegate' });
    const to = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'to-model-proxy-delegate' });
    const cb = vi.fn();
    const spy = vi.spyOn(engine, 'scheduleModelOperation');

    from.scheduleModelOperation(to.uid, cb, { when: 'created' });

    expect(spy).toHaveBeenCalledTimes(1);
    const [argFrom, argUid, argFn, argOptions] = (spy as any).mock.calls[0];
    expect(argFrom).toBe(from);
    expect(argUid).toBe(to.uid);
    expect(argFn).toBe(cb);
    expect(argOptions).toEqual({ when: 'created' });
  });
});
