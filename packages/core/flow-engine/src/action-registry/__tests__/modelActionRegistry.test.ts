/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowModel } from '../../models/flowModel';
import { FlowEngine } from '../../flowEngine';

describe('ModelActionRegistry (class-level)', () => {
  it('warns and overrides when registering duplicate actions on same class', () => {
    class X extends FlowModel {}
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const h1 = vi.fn();
    const h2 = vi.fn();
    X.registerAction({ name: 'dup', handler: h1 });
    X.registerAction({ name: 'dup', handler: h2 });
    const engine = new FlowEngine();
    engine.registerModels({ X });
    const m = engine.createModel<X>({ use: 'X' });
    expect(m.getAction('dup')?.handler).toBe(h2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('merges inheritance and respects override', () => {
    class A extends FlowModel {}
    class B extends A {}

    const a1 = vi.fn();
    const b1 = vi.fn();
    const dupA = vi.fn();
    const dupB = vi.fn();

    A.registerAction({ name: 'a1', handler: a1 });
    A.registerAction({ name: 'dup', handler: dupA });
    B.registerAction({ name: 'b1', handler: b1 });
    B.registerAction({ name: 'dup', handler: dupB });
    const engine = new FlowEngine();
    engine.registerModels({ A, B });
    const a = engine.createModel<A>({ use: 'A' });
    const b = engine.createModel<B>({ use: 'B' });
    // Parent instance sees a1/dup but not b1
    const aMap = a.getActions();
    expect(aMap.has('a1')).toBe(true);
    expect(aMap.has('dup')).toBe(true);
    expect(aMap.has('b1')).toBe(false);
    // Child instance sees merged + override
    const bMap = b.getActions();
    expect(bMap.has('a1')).toBe(true);
    expect(bMap.has('b1')).toBe(true);
    expect(b.getAction('dup')?.handler).toBe(dupB);
  });

  it('lazy invalidation along chain when ancestor updates', () => {
    class M1 extends FlowModel {}
    class M2 extends M1 {}
    class M3 extends M2 {}
    class M4 extends M3 {}
    class M5 extends M4 {}

    const engine = new FlowEngine();
    engine.registerModels({ M1, M2, M3, M4, M5 });
    const m5 = engine.createModel<M5>({ use: 'M5' });
    // warm up cache via instance path
    m5.getActions();
    // register on ancestor M1
    const handler = vi.fn();
    M1.registerAction({ name: 'pNew', handler });
    // Next call should include the new parent action
    expect(m5.getActions().has('pNew')).toBe(true);
  });

  it('child registration does not affect parent set', () => {
    class P extends FlowModel {}
    class C extends P {}
    const engine = new FlowEngine();
    engine.registerModels({ P, C });
    const p = engine.createModel<P>({ use: 'P' });
    const c = engine.createModel<C>({ use: 'C' });
    const childH = vi.fn();
    C.registerAction({ name: 'onlyChild', handler: childH });
    expect(p.getActions().has('onlyChild')).toBe(false);
    expect(c.getActions().has('onlyChild')).toBe(true);
  });

  it('deep override: parent change does not override child override', () => {
    class A extends FlowModel {}
    class B extends A {}
    const aV1 = vi.fn();
    const aV2 = vi.fn();
    const bV = vi.fn();
    A.registerAction({ name: 'k', handler: aV1 });
    B.registerAction({ name: 'k', handler: bV });
    // Update parent
    A.registerAction({ name: 'k', handler: aV2 });
    const engine = new FlowEngine();
    engine.registerModels({ A, B });
    const b = engine.createModel<B>({ use: 'B' });
    expect(b.getAction('k')?.handler).toBe(bV);
  });
});
