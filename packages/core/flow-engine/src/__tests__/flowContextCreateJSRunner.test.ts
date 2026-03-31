/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FlowEngineContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import { JSRunner } from '../JSRunner';

describe('FlowContext async createJSRunner', () => {
  let engine: FlowEngine;
  let engineCtx: FlowEngineContext;

  beforeAll(() => {
    // Create minimal engine and context for testing
    engine = new FlowEngine();
    engineCtx = new FlowEngineContext(engine);
  });

  describe('createJSRunner method', () => {
    it('should be async and return JSRunner instance', async () => {
      const runner = await engineCtx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should pass globals to JSRunner', async () => {
      const customGlobals = { customVar: 'test' };
      const runner = await engineCtx.createJSRunner({ globals: customGlobals });
      const result = await runner.run('return customVar');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe('test');
    });

    it('should always provide ctx in globals', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should support timeout option', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 100 });
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should select appropriate context based on model class', async () => {
      // Test with JSBlockModel
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'JSBlockModel' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);

      // Check if ctx.element is accessible (specific to JSBlockModel)
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
    });

    it('should select JSFieldModel context correctly', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'JSFieldModel' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should select JSColumnModel context correctly', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'JSColumnModel' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should fallback to base context for unknown model', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'UnknownModel' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);

      // Should still have ctx
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should support version option', async () => {
      const runner = await engineCtx.createJSRunner({ version: 'v1' } as any);
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should merge custom globals with ctx', async () => {
      const runner = await engineCtx.createJSRunner({
        globals: { foo: 'bar', baz: 123 },
      });

      const result = await runner.run('return { hasCtx: typeof ctx !== "undefined", foo, baz }');
      expect(result?.success).toBe(true);
      expect(result?.value).toEqual({ hasCtx: true, foo: 'bar', baz: 123 });
    });

    it('should execute async code successfully', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run(`
        return new Promise(resolve => {
          setTimeout(() => resolve('async result'), 10);
        });
      `);
      expect(result?.success).toBe(true);
      expect(result?.value).toBe('async result');
    });

    it('should handle errors gracefully', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('throw new Error("test error")');
      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });

    it('should respect timeout setting', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 50 });
      const result = await runner.run(`
        return new Promise(resolve => {
          setTimeout(() => resolve('done'), 1000);
        });
      `);
      // Should timeout before completing
      expect(result?.success).toBe(false);
    });
  });

  describe('setupRunJSContexts integration', () => {
    it('should auto-setup contexts when createJSRunner is called', async () => {
      // Even if setup wasn't called manually, createJSRunner should trigger it
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', {
        value: { constructor: { name: 'JSBlockModel' } },
      });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeInstanceOf(JSRunner);

      // Verify context is properly initialized
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });
  });
});
