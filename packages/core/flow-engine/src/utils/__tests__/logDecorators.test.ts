/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { LogDuration } from '../logDecorators';

class Demo {
  engine: FlowEngine;
  context: any;
  constructor(engine: FlowEngine) {
    this.engine = engine;
    this.context = engine.context;
  }

  @LogDuration({ type: 'demo.sync', slowMs: 0 })
  syncFast() {
    // do nothing
    return 1;
  }

  @LogDuration({ type: 'demo.async', slowMs: 1 })
  async asyncMaybeSlow(delayMs = 0) {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return 2;
  }

  @LogDuration({ type: (self) => `demo.error`, slowMs: 0 })
  async willFail() {
    throw new Error('boom');
  }

  // no explicit type: falls back to method name
  // 固定为 info 级别，避免在某些环境下 debug 被抑制导致日志缺失
  @LogDuration({ level: 'info' })
  fallbackName() {
    return 3;
  }
  // explicit logger override via getLogger should still publish into engine logBus
  @LogDuration({
    type: 'demo.customlogger',
    getLogger: (self: Demo) => self.engine.logManager.createLogger(),
    slowMs: 0,
  })
  customLoggerPath(engine: FlowEngine) {
    // no-op: 保留方法体，避免对 Reflect 元数据的依赖引入类型错误
    return 4;
  }
}

describe('LogDuration decorator', () => {
  it('logs sync method with auto level', async () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    const d = new Demo(engine);
    expect(d.syncFast()).toBe(1);
    const snap = engine.logManager.bus.getSnapshot();
    const rec = snap.find((r) => r.type === 'demo.sync');
    expect(rec).toBeTruthy();
    expect(rec?.level === 'debug' || rec?.level === 'info').toBe(true);
    expect(typeof rec?.duration).toBe('number');
  });

  it('respects slow threshold to promote level to info', async () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    const d = new Demo(engine);
    await d.asyncMaybeSlow(5);
    const snap = engine.logManager.bus.getSnapshot();
    const rec = snap.find((r) => r.type === 'demo.async');
    expect(rec).toBeTruthy();
    // with slowMs=1 and 5ms delay, it should be info
    expect(rec?.level).toBe('info');
    expect((rec as any).duration).toBeGreaterThanOrEqual(0);
  });

  it('logs error on throw and keeps error serialized', async () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    const d = new Demo(engine);
    await expect(d.willFail()).rejects.toThrow('boom');
    const snap = engine.logManager.bus.getSnapshot();
    const rec = snap.find((r) => r.type === 'demo.error');
    expect(rec).toBeTruthy();
    expect(rec?.level).toBe('error');
    expect((rec as any).error?.message).toContain('boom');
  });

  it('uses method name as default type when not provided', () => {
    const engine = new FlowEngine();
    // 关闭采样与过滤，确保默认方法名日志不会被筛掉
    engine.logManager.setOptions({
      ...engine.logManager.options,
      slowOnly: {},
      dropTypes: [],
      dropTypePrefixes: [],
      samples: {},
    });
    // 在默认测试环境下，基础 logger 级别为 info，会抑制 debug 级别日志。
    // 该用例未指定 slowMs，常为 debug 日志，需显式开启 debug 级别以确保记录写入 bus。
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const d = new Demo(engine);
    d.fallbackName();
    const snap = engine.logManager.bus.getSnapshot();
    const rec = snap.find((r) => r.type === 'fallbackName');
    expect(rec).toBeTruthy();
  });

  it('allows logger override via options.getLogger', () => {
    const engine = new FlowEngine();
    // 确保低级别日志不会被抑制，便于稳定断言
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const d = new Demo(engine);
    // 直接调用：默认 context.logger 来自 engine.logManager.createLogger，
    // 调用后应写入 logBus。
    d.customLoggerPath(engine);
    const snap = engine.logManager.bus.getSnapshot();
    const rec = snap.find((r) => r.type === 'demo.customlogger');
    expect(rec).toBeTruthy();
  });
});
