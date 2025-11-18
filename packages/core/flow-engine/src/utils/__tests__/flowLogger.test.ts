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

describe('FlowLogger', () => {
  it('respects base logger level gating for debug', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();

    // base level = info, debug should be suppressed
    (engine.logger as any).level = 'info';
    const logger = engine.logManager.createLogger();
    logger.debug({ type: 'gating.debug' });
    expect(engine.logManager.bus.getSnapshot().find((r) => r.type === 'gating.debug')).toBeUndefined();

    // enable debug level; should pass through
    (engine.logger as any).level = 'debug';
    logger.debug({ type: 'gating.debug' });
    const rec = engine.logManager.bus.getSnapshot().find((r) => r.type === 'gating.debug');
    expect(rec).toBeTruthy();
    expect(rec?.level).toBe('debug');
  });

  it('child merges bindings into published record', () => {
    const engine = new FlowEngine();
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const base = engine.logManager.createLogger({ a: 1 });
    const child = base.child({ b: 2 });
    child.info({ type: 'child.bindings' });
    const rec = engine.logManager.bus.getSnapshot().find((r) => r.type === 'child.bindings');
    expect(rec).toBeTruthy();
    expect((rec as any).a).toBe(1);
    expect((rec as any).b).toBe(2);
    expect(rec?.level).toBe('info');
  });

  it('derives type from message when missing', () => {
    const engine = new FlowEngine();
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const logger = engine.logManager.createLogger();
    logger.info('event.start some text');
    const rec = engine.logManager.bus.getSnapshot().find((r) => r.type === 'event.start');
    expect(rec).toBeTruthy();
    expect(rec?.level).toBe('info');
  });

  it('serializes error payload and derives type from message', () => {
    const engine = new FlowEngine();
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const logger = engine.logManager.createLogger();
    logger.error(new Error('boom'), 'event.start failing');
    const rec = engine.logManager.bus.getSnapshot().find((r) => r.type === 'event.start');
    expect(rec).toBeTruthy();
    expect(rec?.level).toBe('error');
    expect((rec as any).error?.message).toContain('boom');
  });

  it('maps trace->debug and fatal->error', () => {
    const engine = new FlowEngine();
    (engine.logger as any).level = 'debug';
    engine.logManager.bus.clear();
    const logger = engine.logManager.createLogger();
    logger.trace({ type: 'lvl.trace' });
    logger.fatal({ type: 'lvl.fatal' });
    const snap = engine.logManager.bus.getSnapshot();
    const t = snap.find((r) => r.type === 'lvl.trace');
    const f = snap.find((r) => r.type === 'lvl.fatal');
    expect(t?.level).toBe('debug');
    expect(f?.level).toBe('error');
  });
});
