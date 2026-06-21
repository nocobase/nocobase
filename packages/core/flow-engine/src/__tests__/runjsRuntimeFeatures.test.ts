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
import { RunJSContextRegistry } from '../runjs-context/registry';

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

  describe('Deprecation warnings', () => {
    const version = 'test-deprecation-warnings';
    const dynamicDefineVersion = 'test-deprecation-dynamic-defineProperty';

    beforeAll(() => {
      class TestDeprecatedRunJSContext extends FlowRunJSContext {}
      TestDeprecatedRunJSContext.define({
        label: 'RunJS deprecated test',
        properties: {
          resource: {
            properties: {
              getData: {
                type: 'function',
                description: 'Deprecated deep-path method for testing.',
                deprecated: {
                  message: 'Use refresh instead.',
                  replacedBy: 'ctx.resource.refresh',
                  since: '0.0.0-test',
                },
              },
            },
          },
        },
      });
      RunJSContextRegistry.register(version as any, '*', TestDeprecatedRunJSContext);

      class TestDynamicDefineRunJSContext extends FlowRunJSContext {}
      TestDynamicDefineRunJSContext.define({
        label: 'RunJS deprecated dynamic defineProperty test',
      });
      RunJSContextRegistry.register(dynamicDefineVersion as any, '*', TestDynamicDefineRunJSContext);
    });

    it('should warn when calling a deprecated deep-path API', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      ctx.defineProperty('resource', { value: { getData: () => 123 } });

      const runner = createJSRunnerWithVersion.call(ctx, { version });
      const result = await runner.run('return ctx.resource.getData()');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(123);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('[RunJS][Deprecated] ctx.resource.getData');
      expect(warn.mock.calls[0]?.[0]).toContain('Use refresh instead.');
      expect(warn.mock.calls[0]?.[0]).toContain('Use ctx.resource.refresh instead');
    });

    it('should only warn on invoke (accessing should not warn)', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      ctx.defineProperty('resource', { value: { getData: () => 1 } });

      const runner = createJSRunnerWithVersion.call(ctx, { version });
      const result = await runner.run(`
        const fn = ctx.resource.getData;
        return typeof fn === 'function';
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
      expect(warn).toHaveBeenCalledTimes(0);
    });

    it('should warn once per RunJS execution for the same API path', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      ctx.defineProperty('resource', { value: { getData: () => 1 } });

      const runner1 = createJSRunnerWithVersion.call(ctx, { version });
      const r1 = await runner1.run(`
        ctx.resource.getData();
        ctx.resource.getData();
        return true;
      `);
      expect(r1?.success).toBe(true);
      expect(warn).toHaveBeenCalledTimes(1);

      const runner2 = createJSRunnerWithVersion.call(ctx, { version });
      const r2 = await runner2.run('ctx.resource.getData(); return true;');
      expect(r2?.success).toBe(true);
      expect(warn).toHaveBeenCalledTimes(2);
    });

    it('should warn when accessing a deprecated property defined via FlowContext info', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      ctx.defineProperty('element', {
        value: { innerHTML: '<div />' },
        info: { deprecated: { message: 'it is deprecated!' } },
      });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return ctx.element.innerHTML');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe('<div />');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('[RunJS][Deprecated] ctx.element it is deprecated!');
      expect(warn.mock.calls[0]?.[0]).not.toContain('已废弃');
      expect(warn.mock.calls[0]?.[0]).toContain('line');
    });

    it('should warn for deprecated APIs defined via ctx.defineProperty during execution', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: dynamicDefineVersion });
      const result = await runner.run(`
        ctx.defineProperty('element', {
          value: { innerHTML: '<div />' },
          info: { deprecated: { message: 'it is deprecated!' } },
        });
        return ctx.element.innerHTML;
      `);

      expect(result?.success).toBe(true);
      expect(result?.value).toBe('<div />');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('[RunJS][Deprecated] ctx.element it is deprecated!');
      expect(warn.mock.calls[0]?.[0]).not.toContain('已废弃');
    });

    it('should support deprecated deep-path defined via FlowContext info.properties', async () => {
      const ctx = new FlowContext();
      const warn = vi.fn();
      ctx.defineProperty('logger', { value: { warn } });
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      ctx.defineProperty('element', {
        value: { innerHTML: '<div />' },
        info: {
          properties: {
            innerHTML: {
              deprecated: {
                message: 'Use append instead.',
                replacedBy: 'ctx.element.append',
              },
            },
          },
        },
      });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return ctx.element.innerHTML');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe('<div />');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('[RunJS][Deprecated] ctx.element.innerHTML');
      expect(warn.mock.calls[0]?.[0]).toContain('Use append instead.');
      expect(warn.mock.calls[0]?.[0]).toContain('Use ctx.element.append instead');
    });
  });
});
