/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FlowContext, FlowEngineContext, FlowRunJSContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import { createJSRunnerWithVersion, RunJSContextRegistry } from '..';
import { setupRunJSContexts } from '../runjs-context/setup';

describe('RunJS Edge Cases and Error Handling', () => {
  let engine: FlowEngine;
  let engineCtx: FlowEngineContext;

  beforeAll(async () => {
    await setupRunJSContexts();
    engine = new FlowEngine();
    engineCtx = new FlowEngineContext(engine);
  });

  describe('Missing or invalid model scenarios', () => {
    it('should handle undefined model', async () => {
      const ctx = new FlowEngineContext(engine);
      const runner = await ctx.createJSRunner();

      expect(runner).toBeDefined();
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should handle null model', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', { value: null });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeDefined();
    });

    it('should handle model without constructor', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', { value: {} });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeDefined();
    });

    it('should handle unrecognized model type', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'UnknownModelType' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeDefined();

      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });
  });

  describe('Invalid version handling', () => {
    it('should handle missing version gracefully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSBlockModel' } },
      });

      const runner = createJSRunnerWithVersion.call(ctx, {} as any);
      expect(runner).toBeDefined();
    });

    it('should throw error for invalid version string', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSBlockModel' } },
      });

      expect(() => {
        createJSRunnerWithVersion.call(ctx, {
          version: 'invalid-version',
        } as any);
      }).toThrow();
    });
  });

  describe('Code execution edge cases', () => {
    it('should handle empty code', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('');

      expect(result).toBeDefined();
    });

    it('should handle whitespace-only code', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('   \n\n\t\t   ');

      expect(result).toBeDefined();
    });

    it('should handle syntax errors', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return {invalid: syntax');

      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });

    it('should handle rejected promises', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run(`
        return Promise.reject(new Error('Rejected'));
      `);

      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });

    it('should handle code that returns undefined', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return undefined');

      expect(result?.success).toBe(true);
      expect(result?.value).toBeUndefined();
    });

    it('should handle code that returns null', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return null');

      expect(result?.success).toBe(true);
      expect(result?.value).toBeNull();
    });
  });

  describe('Context property edge cases', () => {
    it('should handle value of 0', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSFieldModel' },
        },
      });
      ctx.defineProperty('value', { value: 0 });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should handle empty string value', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSFieldModel' },
        },
      });
      ctx.defineProperty('value', { value: '' });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should handle false boolean value', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSFieldModel' },
        },
      });
      ctx.defineProperty('value', { value: false });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });
  });

  describe('Registry edge cases', () => {
    it('should handle repeated setup calls idempotently', async () => {
      await setupRunJSContexts();
      await setupRunJSContexts();
      await setupRunJSContexts();

      const ctor = RunJSContextRegistry['resolve']('v1' as any, 'JSBlockModel');
      expect(ctor).toBeDefined();
    });

    it('should handle context creation with minimal delegate', () => {
      const minimalCtx = new FlowContext();
      const runCtx = new FlowRunJSContext(minimalCtx);

      expect(runCtx).toBeDefined();
      expect((runCtx as any).React).toBeDefined();
      expect((runCtx as any).antd).toBeDefined();
      expect((runCtx as any).ReactDOM).toBeDefined();
    });

    it('should handle context creation with null delegate', () => {
      expect(() => {
        new FlowRunJSContext(null as any);
      }).toThrow();
    });

    it('should handle context creation with undefined delegate', () => {
      expect(() => {
        new FlowRunJSContext(undefined as any);
      }).toThrow();
    });
  });

  describe('Timeout edge cases', () => {
    it('should handle very large timeout', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 999999999 });
      const result = await runner.run('return 1 + 1');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(2);
    });

    it('should handle code that completes before timeout', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 200 });
      const result = await runner.run(`
        return new Promise(resolve => {
          setTimeout(() => resolve('done'), 50);
        });
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe('done');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple concurrent runners', async () => {
      const runners = await Promise.all([
        engineCtx.createJSRunner(),
        engineCtx.createJSRunner(),
        engineCtx.createJSRunner(),
      ]);

      const results = await Promise.all([
        runners[0].run('return 1'),
        runners[1].run('return 2'),
        runners[2].run('return 3'),
      ]);

      expect(results[0]?.value).toBe(1);
      expect(results[1]?.value).toBe(2);
      expect(results[2]?.value).toBe(3);
    });

    it('should handle recursive code execution', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 1000 });
      const result = await runner.run(`
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }
        return factorial(10);
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(3628800);
    });
  });
});
