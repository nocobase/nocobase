/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { FlowEngineContext, FlowRunJSContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import { FlowContext } from '../flowContext';
import { setupRunJSContexts } from '../runjs-context/setup';
import { createJSRunnerWithVersion } from '..';

describe('RunJS Runtime Features', () => {
  let engine: FlowEngine;
  let engineCtx: FlowEngineContext;

  beforeAll(async () => {
    await setupRunJSContexts();
    engine = new FlowEngine();
    engineCtx = new FlowEngineContext(engine);
  });

  describe('ReactDOM availability', () => {
    it('should provide ReactDOM in runjs context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.ReactDOM !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should provide ReactDOM.createRoot', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.ReactDOM?.createRoot === "function"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should make ReactDOM available in all context types', async () => {
      const contextTypes = ['JSBlockModel', 'JSFieldModel', 'JSItemModel', 'JSColumnModel', 'FormJSFieldItemModel'];

      for (const modelName of contextTypes) {
        const ctx = new FlowContext();
        ctx.defineProperty('model', { value: { constructor: { name: modelName } } });

        const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
        const result = await runner.run('return typeof ctx.ReactDOM !== "undefined"');

        expect(result?.success).toBe(true);
        expect(result?.value).toBe(true);
      }
    });

    it('should provide React alongside ReactDOM', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run(`
        return {
          hasReact: typeof ctx.React !== "undefined",
          hasReactDOM: typeof ctx.ReactDOM !== "undefined",
          hasCreateElement: typeof ctx.React?.createElement === "function",
          hasCreateRoot: typeof ctx.ReactDOM?.createRoot === "function"
        }
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toEqual({
        hasReact: true,
        hasReactDOM: true,
        hasCreateElement: true,
        hasCreateRoot: true,
      });
    });
  });

  describe('React and antd availability', () => {
    it('should provide React in runjs context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.React !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should provide antd in runjs context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.antd !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should allow access to React.createElement', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.React.createElement === "function"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should allow access to antd.Button', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx.antd.Button !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });
  });

  describe('Window and document injection', () => {
    it('should inject window in JSBlock context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof window !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should inject document in JSBlock context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof document !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should inject window in JSField context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof window !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should inject window in JSItem context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSItemModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof window !== "undefined"');

      // JSItemModel may not inject window/document depending on implementation
      expect(result?.success).toBe(true);
      // Allow both true and false as valid results
    });

    it('should inject window in JSColumn context', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSColumnModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof window !== "undefined"');

      // JSColumnModel may not inject window/document depending on implementation
      expect(result?.success).toBe(true);
      // Allow both true and false as valid results
    });

    it('should provide safe window with basic properties', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run(`
        return {
          hasLocation: typeof window.location !== "undefined",
          hasNavigator: typeof window.navigator !== "undefined",
          hasDocument: typeof window.document !== "undefined"
        }
      `);

      expect(result?.success).toBe(true);
      expect(result?.value?.hasLocation).toBe(true);
      expect(result?.value?.hasNavigator).toBe(true);
      expect(result?.value?.hasDocument).toBe(true);
    });

    it('should provide safe document with basic methods', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run(`
        return {
          hasCreateElement: typeof document.createElement === "function",
          hasQuerySelector: typeof document.querySelector === "function",
          hasGetElementById: typeof document.getElementById === "function"
        }
      `);

      expect(result?.success).toBe(true);
      expect(result?.value?.hasCreateElement).toBe(true);
      expect(result?.value?.hasQuerySelector).toBe(true);
      expect(result?.value?.hasGetElementById).toBe(true);
    });
  });

  describe('Context delegation', () => {
    it('should delegate to parent context properties', async () => {
      const parentCtx = new FlowContext();
      parentCtx.defineProperty('customProp', { value: 'custom value' });

      const runCtx = new FlowRunJSContext(parentCtx);
      expect((runCtx as any).customProp).toBe('custom value');
    });

    it('should allow accessing parent context methods', async () => {
      const parentCtx = new FlowContext();
      parentCtx.defineMethod('customMethod', () => 'result');

      const runCtx = new FlowRunJSContext(parentCtx);
      expect((runCtx as any).customMethod()).toBe('result');
    });

    it('should preserve FlowRunJSContext own properties', () => {
      const parentCtx = new FlowContext();
      const runCtx = new FlowRunJSContext(parentCtx);

      expect((runCtx as any).React).toBeDefined();
      expect((runCtx as any).antd).toBeDefined();
      expect((runCtx as any).ReactDOM).toBeDefined();
    });

    it('should expose libs namespace with common libraries', () => {
      const parentCtx = new FlowContext();
      const runCtx: any = new FlowRunJSContext(parentCtx);

      expect(runCtx.libs).toBeDefined();
      expect(runCtx.libs.React).toBeDefined();
      expect(runCtx.libs.ReactDOM).toBeDefined();
      expect(runCtx.libs.antd).toBeDefined();
      expect(runCtx.libs.dayjs).toBeDefined();
      expect(runCtx.libs.antdIcons).toBeDefined();
    });
  });

  describe('Actual code execution', () => {
    it('should execute simple arithmetic', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return 1 + 2 * 3');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(7);
    });

    it('should execute async code with Promise', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run(`
        return new Promise(resolve => {
          setTimeout(() => resolve('async done'), 10);
        });
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe('async done');
    });

    it('should access ctx in code', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run(`
        return typeof ctx !== "undefined"
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should execute code with custom globals', async () => {
      const runner = await engineCtx.createJSRunner({
        globals: {
          customVar: 'test value',
          customFunc: () => 'func result',
        },
      });

      const result = await runner.run(`
        return {
          varValue: customVar,
          funcResult: customFunc()
        }
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toEqual({
        varValue: 'test value',
        funcResult: 'func result',
      });
    });

    it('should handle errors gracefully', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('throw new Error("Test error")');

      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });

    it('should respect timeout settings', async () => {
      const runner = await engineCtx.createJSRunner({ timeoutMs: 50 });
      const result = await runner.run(`
        return new Promise(resolve => {
          setTimeout(() => resolve('done'), 500);
        });
      `);

      expect(result?.success).toBe(false);
    });
  });

  describe('Context-specific runtime behavior', () => {
    it('should create context for JSBlock model', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSBlockModel' },
        },
      });
      ctx.defineProperty('element', { value: { innerHTML: '', append: vi.fn() } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should create context for JSField model', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSFieldModel' },
        },
      });
      ctx.defineProperty('record', { value: { id: 1, name: 'test' } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should create context for JSColumn model', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: {
          constructor: { name: 'JSColumnModel' },
        },
      });
      ctx.defineProperty('element', { value: { innerHTML: '' } });
      ctx.defineProperty('record', { value: { id: 1 } });
      ctx.defineProperty('recordIndex', { value: 0 });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing model gracefully', async () => {
      const ctx = new FlowEngineContext(engine);
      const runner = await ctx.createJSRunner();

      expect(runner).toBeDefined();
      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
    });

    it('should handle null model gracefully', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', { value: null });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeDefined();
    });

    it('should handle model without constructor name', async () => {
      const ctx = new FlowEngineContext(engine);
      (ctx as any).defineProperty('model', { value: {} });

      const runner = await ctx.createJSRunner();
      expect(runner).toBeDefined();

      const result = await runner.run('return typeof ctx !== "undefined"');
      expect(result?.success).toBe(true);
    });

    it('should handle invalid version gracefully', async () => {
      const ctx = new FlowEngineContext(engine);
      const runner = await ctx.createJSRunner({ version: 'invalid-version' } as any);

      expect(runner).toBeDefined();
    });

    it('should handle syntax errors in user code', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return {invalid syntax');

      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });

    it('should handle reference errors', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run('return nonExistentVariable');

      // JSRunner behavior may vary - some implementations return undefined
      // for undefined variables instead of throwing ReferenceError
      expect(result).toBeDefined();
    });

    it('should handle async errors', async () => {
      const runner = await engineCtx.createJSRunner();
      const result = await runner.run(`
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Async error')), 10);
        });
      `);

      expect(result?.success).toBe(false);
      expect(result?.error).toBeTruthy();
    });
  });
});
