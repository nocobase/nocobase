/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowResource, ResourceError } from '../flowResource';

describe('FlowResource - data handling', () => {
  it('should initialize with null data and hasData() false', () => {
    const r = new FlowResource();
    expect(r.getData()).toBeNull();
    expect(r.hasData()).toBe(false);
  });

  it('should detect arrays and objects correctly in hasData()', () => {
    const r = new FlowResource<any>();

    r.setData([]);
    expect(r.hasData()).toBe(false);

    r.setData([1]);
    expect(r.hasData()).toBe(true);

    r.setData({});
    expect(r.hasData()).toBe(false);

    r.setData({ a: 1 });
    expect(r.hasData()).toBe(true);
  });

  it('setData should be chainable', () => {
    const r = new FlowResource<number>();
    const ret = r.setData(123);
    expect(ret).toBe(r);
    expect(r.getData()).toBe(123);
  });
});

describe('FlowResource - meta handling', () => {
  it('should get and set meta, including specific keys', () => {
    const r = new FlowResource();

    expect(r.getMeta()).toEqual({});
    expect(r.getMeta('x')).toBeUndefined();

    r.setMeta({ a: 1 });
    expect(r.getMeta()).toEqual({ a: 1 });
    expect(r.getMeta('a')).toBe(1);

    r.setMeta({ b: 2 });
    expect(r.getMeta()).toEqual({ a: 1, b: 2 });
    expect(r.getMeta('b')).toBe(2);
  });

  it('setMeta should be chainable', () => {
    const r = new FlowResource();
    const ret = r.setMeta({ k: 'v' });
    expect(ret).toBe(r);
    expect(r.getMeta()).toEqual({ k: 'v' });
  });
});

describe('FlowResource - error handling', () => {
  it('should get/set/clear error correctly', () => {
    const r = new FlowResource();

    expect(r.error).toBeNull();
    expect(r.getError()).toBeNull();

    const err = new ResourceError({ response: { data: { error: { message: 'boom', code: 'X' } } } });
    const ret = r.setError(err);
    expect(ret).toBe(r);
    expect(r.error).toBe(err);
    expect(r.getError()).toBe(err);

    r.setError(null);
    expect(r.error).toBeNull();
    expect(r.getError()).toBeNull();

    r.setError(err);
    const ret2 = r.clearError();
    expect(ret2).toBe(r);
    expect(r.error).toBeNull();
  });
});

describe('FlowResource - events', () => {
  it('should register, emit, and remove event handlers', () => {
    const r = new FlowResource();

    const fn1 = vi.fn();
    const fn2 = vi.fn();

    r.on('test', fn1);
    r.on('test', fn2);

    r.emit('test', 1, 2);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn1).toHaveBeenCalledWith(1, 2);
    expect(fn2).toHaveBeenCalledWith(1, 2);

    r.off('test', fn1);
    r.emit('test', 'a', 'b');

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenLastCalledWith('a', 'b');

    const fn3 = vi.fn();
    r.off('test', fn3);
    r.emit('test', 42);
    expect(fn2).toHaveBeenCalledTimes(3);
    expect(fn2).toHaveBeenLastCalledWith(42);
  });
});
