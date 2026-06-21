/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 */
import { describe, expect, it } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('FlowModel per-class Events', () => {
  it('registerEvent per class and getEvents with inheritance + engine merge', async () => {
    class A extends FlowModel {}
    class B extends A {}

    const engine = new FlowEngine();
    engine.registerModels({ A, B });

    // global
    engine.registerEvents({
      global: {
        name: 'global',
        title: 'Global',
        handler: (ctx, params) => {},
      },
    });

    A.registerEvent({
      name: 'a',
      title: 'A',
      handler: (ctx, params) => {},
    });
    A.registerEvent({
      name: 'dup',
      title: 'A-dup',
      handler: (ctx, params) => {},
    });
    B.registerEvent({
      name: 'b',
      title: 'B',
      handler: (ctx, params) => {},
    });
    B.registerEvent({
      name: 'dup',
      title: 'B-dup',
      handler: (ctx, params) => {},
    });

    const m = engine.createModel<B>({ use: 'B' });

    const events = m.getEvents();
    expect(events.has('global')).toBe(true);
    expect(events.has('a')).toBe(true);
    expect(events.has('b')).toBe(true);
    // child overrides parent with same name
    expect(events.get('dup')?.title).toBe('B-dup');

    // getEvent should prefer class events, then fallback to engine
    expect(m.getEvent('b')?.title).toBe('B');
    expect(m.getEvent('a')?.title).toBe('A');
    expect(m.getEvent('global')?.title).toBe('Global');
  });
});
