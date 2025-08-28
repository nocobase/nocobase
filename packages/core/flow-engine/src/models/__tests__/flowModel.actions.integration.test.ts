/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('FlowModel + Engine actions integration', () => {
  it('merges engine global actions and class-level actions', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });

    const g = vi.fn();
    const c = vi.fn();
    engine.registerActions({ g: { name: 'g', handler: g } });
    M.registerAction({ name: 'c', handler: c });

    const m = engine.createModel<M>({ use: 'M' });
    const map = m.getActions();
    expect(map.has('g')).toBe(true);
    expect(map.has('c')).toBe(true);
  });

  it('class-level overrides engine action with same name', () => {
    const engine = new FlowEngine();
    class X extends FlowModel {}
    engine.registerModels({ X });

    const g = vi.fn();
    const c = vi.fn();
    engine.registerActions({ dup: { name: 'dup', handler: g } });
    X.registerAction({ name: 'dup', handler: c });

    const m = engine.createModel<X>({ use: 'X' });
    expect(m.getAction('dup')?.handler).toBe(c);
  });

  it('long inheritance chain picks up ancestor updates on next call', () => {
    const engine = new FlowEngine();
    class A extends FlowModel {}
    class B extends A {}
    class C extends B {}
    class D extends C {}
    class E extends D {}
    engine.registerModels({ A, B, C, D, E });

    const model = engine.createModel<E>({ use: 'E' });
    // warm
    model.getActions();

    const handler = vi.fn();
    A.registerAction({ name: 'ancestor', handler });

    const map = model.getActions();
    expect(map.has('ancestor')).toBe(true);
  });

  it('engine actions added after model creation are immediately visible', () => {
    const engine = new FlowEngine();
    class N extends FlowModel {}
    engine.registerModels({ N });
    const m = engine.createModel<N>({ use: 'N' });
    // Initially empty
    expect(m.getActions().has('g2')).toBe(false);
    engine.registerActions({ g2: { name: 'g2', handler: () => {} } });
    // Immediately visible without any invalidation call
    expect(m.getActions().has('g2')).toBe(true);
  });

  it('getAction falls back to engine when not defined in class chain', () => {
    const engine = new FlowEngine();
    class Q extends FlowModel {}
    engine.registerModels({ Q });
    const g = () => {};
    engine.registerActions({ onlyG: { name: 'onlyG', handler: g } });
    const m = engine.createModel<Q>({ use: 'Q' });
    expect(m.getAction('onlyG')?.handler).toBe(g);
  });

  it('mutating returned map from getActions (deleting key) does not affect internal registries', () => {
    const engine = new FlowEngine();
    class Z extends FlowModel {}
    engine.registerModels({ Z });
    const h = () => {};
    Z.registerAction({ name: 'zAct', handler: h });
    const m = engine.createModel<Z>({ use: 'Z' });
    const map = m.getActions();
    // delete existing key from the returned map copy
    map.delete('zAct');
    // Internal registries are not polluted
    expect(m.getAction('zAct')?.handler).toBe(h);
  });
});
