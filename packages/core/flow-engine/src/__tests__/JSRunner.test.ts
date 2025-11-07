/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSRunner } from '../JSRunner';

describe('JSRunner', () => {
  let originalSearch: string;

  beforeEach(() => {
    originalSearch = globalThis.location?.search || '';
  });

  afterEach(() => {
    // 恢复 URL 查询参数，避免影响其他用例
    try {
      if (typeof window !== 'undefined' && typeof window.history?.replaceState === 'function') {
        window.history.replaceState({}, '', originalSearch || '');
      }
    } catch (_) {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('executes simple code and returns value', async () => {
    const runner = new JSRunner();
    const result = await runner.run('return 1 + 2 + 3');
    expect(result.success).toBe(true);
    expect(result.value).toBe(6);
  });

  it('injects custom globals and supports register()', async () => {
    const runner = new JSRunner({ globals: { foo: 42 } });
    const res1 = await runner.run('return foo');
    expect(res1.success).toBe(true);
    expect(res1.value).toBe(42);

    runner.register('bar', 'baz');
    const res2 = await runner.run('return bar');
    expect(res2.success).toBe(true);
    expect(res2.value).toBe('baz');
  });

  it('exposes console in sandbox by default', async () => {
    const runner = new JSRunner();
    const result = await runner.run('return typeof console !== "undefined"');
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  it('supports timers (setTimeout) inside evaluated code', async () => {
    const runner = new JSRunner();
    const result = await runner.run(`
      return new Promise((resolve) => {
        setTimeout(() => resolve('ok'), 20);
      });
    `);
    expect(result.success).toBe(true);
    expect(result.value).toBe('ok');
  });

  it('handles thrown errors and marks as non-timeout', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const runner = new JSRunner();
    const result = await runner.run('throw new Error("boom")');
    expect(result.success).toBe(false);
    expect(result.timeout).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe('boom');
    expect(spy).toHaveBeenCalled();
  });

  it('respects timeout setting and marks timeout=true', async () => {
    const runner = new JSRunner({ timeoutMs: 10 });
    const result = await runner.run(`
      return new Promise((resolve) => setTimeout(() => resolve('late'), 100));
    `);
    expect(result.success).toBe(false);
    expect(result.timeout).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe('Execution timed out');
  });

  it('skips execution when URL contains skipRunJs=true', async () => {
    // 模拟预览模式下通过 URL 参数跳过代码执行
    if (typeof window !== 'undefined' && typeof window.history?.pushState === 'function') {
      window.history.pushState({}, '', '?skipRunJs=true');
    }
    const runner = new JSRunner();
    const result = await runner.run('throw new Error("should not run")');
    expect(result.success).toBe(true);
    expect(result.value).toBeNull();
  });
});
