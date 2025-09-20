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
    engine.registerEvents({ global: { name: 'global', label: 'Global' } });

    A.registerEvent({ name: 'a', label: 'A' });
    A.registerEvent({ name: 'dup', label: 'A-dup' });
    B.registerEvent({ name: 'b', label: 'B' });
    B.registerEvent({ name: 'dup', label: 'B-dup' });

    const m = engine.createModel<B>({ use: 'B' });

    const events = m.getEvents();
    expect(events.has('global')).toBe(true);
    expect(events.has('a')).toBe(true);
    expect(events.has('b')).toBe(true);
    // child overrides parent with same name
    expect(events.get('dup')?.label).toBe('B-dup');

    // getEvent should prefer class events, then fallback to engine
    expect(m.getEvent('b')?.label).toBe('B');
    expect(m.getEvent('a')?.label).toBe('A');
    expect(m.getEvent('global')?.label).toBe('Global');
  });
});
