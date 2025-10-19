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

describe('LogManager', () => {
  it('applies ring buffer capacity', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    // shrink capacity
    const prev = engine.logManager.options;
    engine.logManager.setOptions({ ...prev, capacity: 5 });
    for (let i = 1; i <= 10; i += 1) {
      engine.logManager.publish('info', { type: 'cap.test', seq: i });
    }
    const snap = engine.logManager.bus.getSnapshot();
    expect(snap.length).toBe(5);
    expect((snap[0] as any).seq).toBe(6);
    expect((snap[4] as any).seq).toBe(10);
  });

  it('respects samples per type', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    engine.logManager.updateOptions({ samples: { 'samp.t': 3 } });
    for (let i = 0; i < 9; i += 1) {
      engine.logManager.publish('info', { type: 'samp.t' });
    }
    const snap = engine.logManager.bus.getSnapshot().filter((r) => r.type === 'samp.t');
    expect(snap.length).toBe(3); // keep 1 of every 3
  });

  it('slowOnly filters only slow event.end', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    engine.logManager.setOptions({ ...engine.logManager.options, slowOnly: { event: true }, slowEventMs: 10 });
    // below threshold should be dropped
    engine.logManager.publish('info', { type: 'event.end', duration: 5 });
    // above threshold should be kept
    engine.logManager.publish('info', { type: 'event.end', duration: 15 });
    const snap = engine.logManager.bus.getSnapshot().filter((r) => r.type === 'event.end');
    expect(snap.length).toBe(1);
    expect((snap[0] as any).duration).toBe(15);
  });

  it('drops records by type and prefix', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    engine.logManager.updateOptions({ dropTypes: ['drop.me'], dropTypePrefixes: ['drop.'] });
    engine.logManager.publish('info', { type: 'drop.me' });
    engine.logManager.publish('info', { type: 'drop.anything' });
    engine.logManager.publish('info', { type: 'keep.it' });
    const snap = engine.logManager.bus.getSnapshot();
    expect(snap.find((r) => r.type === 'drop.me')).toBeUndefined();
    expect(snap.find((r) => r.type === 'drop.anything')).toBeUndefined();
    expect(snap.find((r) => r.type === 'keep.it')).toBeTruthy();
  });

  it('applies filters when present on record', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    engine.logManager.updateOptions({ filters: { types: ['keep.this'], modelId: ['id1'] } });
    engine.logManager.publish('info', { type: 'keep.this', modelId: 'id1' });
    engine.logManager.publish('info', { type: 'keep.this', modelId: 'id2' });
    engine.logManager.publish('info', { type: 'other', modelId: 'id1' });
    const snap = engine.logManager.bus.getSnapshot();
    expect(snap.length).toBe(1);
    expect(snap[0].type).toBe('keep.this');
    expect((snap[0] as any).modelId).toBe('id1');
  });

  it('limits per-type rate using maxPerSecByType', () => {
    const engine = new FlowEngine();
    engine.logManager.bus.clear();
    engine.logManager.updateOptions({ maxPerSecByType: { 'rate.t': 2 } });
    for (let i = 0; i < 5; i += 1) {
      engine.logManager.publish('info', { type: 'rate.t' });
    }
    const snap = engine.logManager.bus.getSnapshot().filter((r) => r.type === 'rate.t');
    expect(snap.length).toBe(2);
  });
});
