/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_RUNJS_TIMEOUT_MS, JSRunner, shouldPreprocessRunJSTemplates } from '../JSRunner';
import {
  getRunJSRuntimeReporting,
  type RunJSExecutionIdentity,
  type RunJSRuntimeEvent,
  type RunJSRuntimeReporter,
} from '../runjsRuntimeReporter';

function createRuntimeReporting(identity: RunJSExecutionIdentity, events: RunJSRuntimeEvent[]) {
  const reporter: RunJSRuntimeReporter = {
    report: (event) => {
      events.push(event);
    },
  };
  return { identity, reporter };
}

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
        window,
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
        window,
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
        window,
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
        window,
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

  it('times out default executions after five seconds and clears the timeout timer', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const runner = new JSRunner();
      const resultPromise = runner.run(`
        return new Promise((resolve) => {
          setTimeout(() => resolve('ok'), 6000);
        });
      `);

      await vi.advanceTimersByTimeAsync(5000);
      const result = await resultPromise;

      expect(DEFAULT_RUNJS_TIMEOUT_MS).toBe(5_000);
      expect(result.success).toBe(false);
      expect(result.timeout).toBe(true);
      expect(spy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('allows callers to opt into a thirty-second timeout', async () => {
    vi.useFakeTimers();
    try {
      const runner = new JSRunner({ timeoutMs: 30_000 });
      const resultPromise = runner.run(`
        return new Promise((resolve) => {
          setTimeout(() => resolve('ok'), 6000);
        });
      `);

      await vi.advanceTimersByTimeAsync(6000);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('ok');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
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

  it('keeps concurrent execution reporters scoped to their own identity', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const firstEvents: RunJSRuntimeEvent[] = [];
    const secondEvents: RunJSRuntimeEvent[] = [];
    const firstIdentity = {
      executionId: 'execution-a',
      artifactHash: 'artifact-a',
      sourceURL: 'nocobase-runjs://bundle/artifact-a.js',
    };
    const secondIdentity = {
      executionId: 'execution-b',
      artifactHash: 'artifact-b',
      sourceURL: 'nocobase-runjs://bundle/artifact-b.js',
    };
    const first = new JSRunner({ runtimeReporting: createRuntimeReporting(firstIdentity, firstEvents) });
    const second = new JSRunner({ runtimeReporting: createRuntimeReporting(secondIdentity, secondEvents) });

    await Promise.all([
      first.run('throw new Error("first failure")'),
      second.run('return Promise.reject(new Error("second failure"))'),
    ]);

    expect(firstEvents).toHaveLength(1);
    expect(firstEvents[0]).toMatchObject({
      identity: firstIdentity,
      issue: { ruleId: 'promise-rejection', message: 'first failure' },
    });
    expect(secondEvents).toHaveLength(1);
    expect(secondEvents[0]).toMatchObject({
      identity: secondIdentity,
      issue: { ruleId: 'promise-rejection', message: 'second failure' },
    });
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('reports synchronous evaluation failures without changing the legacy result', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const events: RunJSRuntimeEvent[] = [];
    const runner = new JSRunner({
      runtimeReporting: createRuntimeReporting(
        {
          executionId: 'execution-syntax',
          artifactHash: 'artifact-syntax',
          sourceURL: 'nocobase-runjs://bundle/artifact-syntax.js',
        },
        events,
      ),
    });

    const result = await runner.run('return {');

    expect(result.success).toBe(false);
    expect(result.timeout).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0].issue.ruleId).toBe('runtime-error');
  });

  it('reports timeout without claiming cancellation', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const events: RunJSRuntimeEvent[] = [];
      const runner = new JSRunner({
        timeoutMs: 20,
        runtimeReporting: createRuntimeReporting(
          {
            executionId: 'execution-timeout',
            artifactHash: 'artifact-timeout',
            sourceURL: 'nocobase-runjs://bundle/artifact-timeout.js',
          },
          events,
        ),
      });

      const resultPromise = runner.run('return new Promise(() => undefined)');
      await vi.advanceTimersByTimeAsync(20);
      const result = await resultPromise;

      expect(result.timeout).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0].issue).toMatchObject({
        ruleId: 'timeout',
        executionMayContinue: true,
        details: { timeoutMs: 20 },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('redacts and truncates reporter payloads without exposing the original Error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const events: RunJSRuntimeEvent[] = [];
    const runner = new JSRunner({
      runtimeReporting: createRuntimeReporting(
        {
          executionId: 'execution-secret',
          artifactHash: 'artifact-secret',
          sourceURL: 'nocobase-runjs://bundle/artifact-secret.js',
          metadata: { previewSessionId: 'preview-secret' },
        },
        events,
      ),
    });

    await runner.run(
      'throw new Error("Authorization: Bearer token-value /srv/private/config.json request body: {password:secret}")',
    );

    expect(events).toHaveLength(1);
    const serialized = JSON.stringify(events[0]);
    expect(serialized).not.toContain('token-value');
    expect(serialized).not.toContain('/srv/private');
    expect(serialized).not.toContain('password:secret');
    expect(events[0].issue).not.toHaveProperty('error');
    expect(events[0].issue.message.length).toBeLessThanOrEqual(1000);
  });

  it('clears stale reporting metadata when a context is reused without a reporter', () => {
    const ctx = {};
    const events: RunJSRuntimeEvent[] = [];
    new JSRunner({
      globals: { ctx },
      runtimeReporting: createRuntimeReporting(
        {
          executionId: 'execution-scoped',
          artifactHash: 'artifact-scoped',
          sourceURL: 'nocobase-runjs://bundle/artifact-scoped.js',
        },
        events,
      ),
    });
    expect(getRunJSRuntimeReporting(ctx)?.identity.executionId).toBe('execution-scoped');

    new JSRunner({ globals: { ctx } });

    expect(getRunJSRuntimeReporting(ctx)).toBeUndefined();
  });

  it('ignores reporter failures and preserves the original execution result', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const runner = new JSRunner({
      runtimeReporting: {
        identity: {
          executionId: 'execution-reporter-failure',
          artifactHash: 'artifact-reporter-failure',
          sourceURL: 'nocobase-runjs://bundle/artifact-reporter-failure.js',
        },
        reporter: {
          report: () => {
            throw new Error('reporter failed');
          },
        },
      },
    });

    const result = await runner.run('throw new Error("user failure")');

    expect(result.success).toBe(false);
    expect((result.error as Error).message).toBe('user failure');
  });

  it('returns friendly hint when bare {{ctx.xxx}} appears in syntax error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const runner = new JSRunner();
    const result = await runner.run('const z = {{ctx.user.id}}');
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(SyntaxError);
    const msg = String((result.error as any)?.message || '');
    expect(msg).toContain('"{{ctx.user.id}}" has been deprecated');
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
