/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import RunningExecutionRegistry from '../RunningExecutionRegistry';

describe('RunningExecutionRegistry', () => {
  it('aborts every handler registered for the same execution', () => {
    const registry = new RunningExecutionRegistry();
    const first = { abort: vi.fn() };
    const second = { abort: vi.fn() };

    registry.register(1, first);
    registry.register(1, second);

    expect(registry.abort(1, 'timeout')).toBe(true);
    expect(first.abort).toHaveBeenCalledWith('timeout');
    expect(second.abort).toHaveBeenCalledWith('timeout');
  });

  it('unregisters only the handler owned by a disposer', () => {
    const registry = new RunningExecutionRegistry();
    const first = { abort: vi.fn() };
    const second = { abort: vi.fn() };
    const disposeFirst = registry.register('1', first);
    registry.register('1', second);

    disposeFirst();

    expect(registry.abort('1')).toBe(true);
    expect(first.abort).not.toHaveBeenCalled();
    expect(second.abort).toHaveBeenCalledOnce();
  });
});
