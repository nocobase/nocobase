/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSRunner, shouldPreprocessRunJSTemplates } from '../JSRunner';
import { createSafeWindow } from '../utils';

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

  it('shouldPreprocessRunJSTemplates: explicit option has highest priority', () => {
    expect(shouldPreprocessRunJSTemplates({ version: 'v2', preprocessTemplates: true })).toBe(true);
    expect(shouldPreprocessRunJSTemplates({ version: 'v1', preprocessTemplates: false })).toBe(false);
  });

  it('shouldPreprocessRunJSTemplates: falls back to version policy', () => {
    expect(shouldPreprocessRunJSTemplates({ version: 'v1' })).toBe(true);
    expect(shouldPreprocessRunJSTemplates({ version: 'v2' })).toBe(false);
    expect(shouldPreprocessRunJSTemplates({})).toBe(true);
    expect(shouldPreprocessRunJSTemplates()).toBe(true);
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

  it('auto-lifts Blob from injected window to top-level globals', async () => {
    if (typeof Blob === 'undefined') {
      return;
    }

    const runner = new JSRunner({
      globals: {
        window: createSafeWindow(),
      },
    });

    const result = await runner.run('return new Blob(["x"]).size');
    expect(result.success).toBe(true);
    expect(result.value).toBe(1);
  });

  it('keeps explicit globals.Blob higher priority than auto-lifted Blob', async () => {
    const explicitBlob = function ExplicitBlob(this: any, chunks: any[]) {
      this.size = Array.isArray(chunks) ? chunks.length : 0;
    } as any;

    const runner = new JSRunner({
      globals: {
        window: createSafeWindow(),
        Blob: explicitBlob,
      },
    });

    const result = await runner.run('const b = new Blob([1,2,3]); return b.size;');
    expect(result.success).toBe(true);
    expect(result.value).toBe(3);
  });

  it('auto-lifts URL from injected window to top-level globals', async () => {
    const runner = new JSRunner({
      globals: {
        window: createSafeWindow(),
      },
    });

    const result = await runner.run('return typeof URL.createObjectURL === "function"');
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  it('keeps explicit globals.URL higher priority than auto-lifted URL', async () => {
    const explicitURL = {
      createObjectURL: () => 'explicit://url',
      revokeObjectURL: (_url: string) => undefined,
    };

    const runner = new JSRunner({
      globals: {
        window: createSafeWindow(),
        URL: explicitURL,
      },
    });

    const result = await runner.run('return URL.createObjectURL(new Blob(["x"]))');
    expect(result.success).toBe(true);
    expect(result.value).toBe('explicit://url');
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

  it('returns friendly hint when bare {{ctx.xxx}} appears in syntax error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const runner = new JSRunner();
    const result = await runner.run('const z = {{ctx.user.id}}');
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(SyntaxError);
    const msg = String((result.error as any)?.message || '');
    expect(msg).toContain('"{{ctx.user.id}}" has been deprecated in v2');
    expect(msg).toContain('await ctx.getVar("ctx.user.id")');
    expect(msg).not.toContain('(at ');
    expect((result.error as any)?.__runjsHideLocation).toBe(true);
    expect(spy).toHaveBeenCalled();
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
