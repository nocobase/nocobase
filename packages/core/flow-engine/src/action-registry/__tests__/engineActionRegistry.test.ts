/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { EngineActionRegistry } from '../EngineActionRegistry';

describe('EngineActionRegistry', () => {
  it('registerAction/getAction and duplicate detection', () => {
    const reg = new EngineActionRegistry();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    reg.registerActions({
      a: { name: 'a', handler: handler1 },
    });
    expect(reg.getAction('a')?.name).toBe('a');
    expect(reg.getAction('a')?.handler).toBe(handler1);

    // Registering duplicate action should warn and override
    reg.registerActions({ a: { name: 'a', handler: handler2 } });
    expect(warnSpy).toHaveBeenCalledWith("FlowEngine: Action with name 'a' is already registered.");
    expect(reg.getAction('a')?.handler).toBe(handler2);

    warnSpy.mockRestore();
  });

  it('getActions returns a copy (not affecting registry)', () => {
    const reg = new EngineActionRegistry();
    reg.registerActions({ base: { name: 'base', handler: () => {} } });
    const map = reg.getActions();
    map.set('hijack', { name: 'hijack', handler: () => {} });
    expect(reg.getAction('hijack')).toBeUndefined();
    expect(reg.getAction('base')).toBeDefined();
  });
});
