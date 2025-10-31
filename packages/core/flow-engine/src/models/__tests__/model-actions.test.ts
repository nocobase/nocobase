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

describe('FlowModel per-class Actions', () => {
  it('registerAction per class and getActions with inheritance', async () => {
    class A extends FlowModel {}
    class B extends A {}

    const engine = new FlowEngine();
    engine.registerModels({ A, B });

    // global action
    const globalHandler = vi.fn();
    engine.registerActions({ global: { name: 'global', handler: globalHandler } });

    const a1 = vi.fn();
    const b1 = vi.fn();
    const dupA = vi.fn();
    const dupB = vi.fn();

    A.registerAction({ name: 'a1', handler: a1 });
    A.registerAction({ name: 'dup', handler: dupA });
    B.registerAction({ name: 'b1', handler: b1 });
    B.registerAction({ name: 'dup', handler: dupB });

    const m = engine.createModel<B>({ use: 'B' });

    const actions = m.getActions();
    expect(actions.has('global')).toBe(true);
    expect(actions.has('a1')).toBe(true);
    expect(actions.has('b1')).toBe(true);
    // child overrides parent with same name
    expect(actions.get('dup')?.handler).toBe(dupB);

    // getAction should prefer class actions, then fallback to engine
    expect(m.getAction('b1')?.handler).toBe(b1);
    expect(m.getAction('a1')?.handler).toBe(a1);
    expect(m.getAction('global')?.handler).toBe(globalHandler);
  });

  it('applyFlow should resolve model-specific actions', async () => {
    class M extends FlowModel {}
    const engine = new FlowEngine();
    engine.registerModels({ M });

    const modelHandler = vi.fn().mockReturnValue('ok');
    M.registerAction({ name: 'onlyM', handler: modelHandler });

    M.registerFlow({
      key: 'test',
      steps: {
        s1: { use: 'onlyM' },
      },
    });

    const m = engine.createModel<M>({ use: 'M' });
    await m.applyFlow('test');
    expect(modelHandler).toHaveBeenCalled();
  });
});
