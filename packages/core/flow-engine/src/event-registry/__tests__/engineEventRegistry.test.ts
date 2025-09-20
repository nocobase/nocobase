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
import { EngineEventRegistry } from '../../event-registry/EngineEventRegistry';

describe('EngineEventRegistry', () => {
  it('registerEvent/getEvent and duplicate detection', () => {
    const reg = new EngineEventRegistry();

    reg.registerEvents({
      e1: { name: 'e1', label: 'E1' },
      dup: { name: 'dup', label: 'v1' },
    });

    // duplicate overrides
    reg.registerEvent({ name: 'dup', label: 'v2' });

    const all = reg.getEvents();
    expect(all.has('e1')).toBe(true);
    expect(all.get('e1')?.label).toBe('E1');
    expect(all.get('dup')?.label).toBe('v2');

    const one = reg.getEvent('dup');
    expect(one?.label).toBe('v2');
  });
});
