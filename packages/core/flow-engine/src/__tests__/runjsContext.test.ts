/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  RunJSContextRegistry,
  getRunJSDocFor,
  createJSRunnerWithVersion,
  getRunJSScenesForModel,
  getRunJSScenesForContext,
} from '..';
import { setupRunJSContexts } from '../runjs-context/setup';
import { FlowContext } from '../flowContext';
import { JSRunner } from '../JSRunner';

describe('flowRunJSContext registry and doc', () => {
  beforeAll(async () => {
    await setupRunJSContexts();
  });

  describe('setupRunJSContexts', () => {
    it('should register v1 mapping', () => {
      expect(RunJSContextRegistry['resolve']('v1' as any, '*')).toBeTruthy();
    });

    it('should register all context types', () => {
      const contextTypes = [
        'JSBlockModel',
        'JSFieldModel',
        'JSItemModel',
        'JSColumnModel',
        'FormJSFieldItemModel',
        'JSRecordActionModel',
        'JSCollectionActionModel',
      ];

      contextTypes.forEach((modelClass) => {
        const ctor = RunJSContextRegistry['resolve']('v1' as any, modelClass);
        expect(ctor).toBeTruthy();
      });
    });

    it('should expose scene metadata for contexts', () => {
      expect(getRunJSScenesForModel('JSBlockModel', 'v1')).toEqual(['block']);
      expect(getRunJSScenesForModel('JSFieldModel', 'v1')).toEqual(['detail']);
      expect(getRunJSScenesForModel('UnknownModel', 'v1')).toEqual([]);
    });

    it('should only execute once (idempotent)', async () => {
      const ctor1 = RunJSContextRegistry['resolve']('v1' as any, '*');
      await setupRunJSContexts();
      await setupRunJSContexts();
      const ctor2 = RunJSContextRegistry['resolve']('v1' as any, '*');
      expect(ctor1).toBe(ctor2);
    });
  });

  describe('getRunJSDocFor', () => {
    it('should pick subclass by model class name', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/RunJS/);
    });

    it('should return base doc for unknown model', () => {
      const ctx: any = { model: { constructor: { name: 'UnknownModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc).toBeTruthy();
      expect(doc?.label).toMatch(/RunJS base/);
    });

    it('should support locale-specific doc', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      const message = doc?.properties?.message;
      const messageText =
        typeof message === 'string' ? message : (message as any)?.description ?? (message as any)?.detail ?? '';
      expect(String(messageText)).toMatch(/Ant Design 全局消息/);
    });

    it('should fallback to English when locale is not found', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toBeTruthy();
    });
  });

  describe('createJSRunnerWithVersion', () => {
    it('should return a JSRunner instance', () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSFieldModel' } },
      });
      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      expect(runner).toBeInstanceOf(JSRunner);
    });

    it('should execute JavaScript code successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSFieldModel' } },
      });
      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return 1 + 1');
      expect(result?.success).toBe(true);
      expect(result?.value).toBe(2);
    });

    it('should inject window/document for field contexts', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSFieldModel' } },
      });
      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const r = await runner.run('return typeof window !== "undefined" && typeof document !== "undefined"');
      expect(r.success && r.value).toBe(true);
    });

    it('should inject window/document for block contexts', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSBlockModel' } },
      });
      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const r = await runner.run('return typeof window !== "undefined" && typeof document !== "undefined"');
      expect(r.success && r.value).toBe(true);
    });

    it('should provide ctx variable in globals', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'JSFieldModel' } },
      });
      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const r = await runner.run('return typeof ctx !== "undefined"');
      expect(r.success && r.value).toBe(true);
    });

    it('should throw error when no context is registered', () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', {
        value: { constructor: { name: 'UnknownModel' } },
      });
      // Clear registry temporarily - this test checks the error case
      const originalResolve = RunJSContextRegistry['resolve'];
      RunJSContextRegistry['resolve'] = () => undefined;

      expect(() => {
        createJSRunnerWithVersion.call(ctx, { version: 'v999' as any });
      }).toThrow(/No RunJSContext registered/);

      // Restore
      RunJSContextRegistry['resolve'] = originalResolve;
    });
  });

  describe('Context-specific features', () => {
    it('JSColumnModel context should be available', () => {
      const ctor = RunJSContextRegistry['resolve']('v1' as any, 'JSColumnModel');
      expect(ctor).toBeTruthy();
      const ctx = new FlowContext();
      const instance = new (ctor as any)(ctx);
      expect(instance).toBeTruthy();
    });

    it('should resolve scenes from context instance', () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSColumnModel' } } });
      expect(getRunJSScenesForContext(ctx as any, { version: 'v1' })).toEqual(['table']);
    });

    it('JSBlockModel context should have element property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
    });

    it('JSFieldModel context should have record property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSFieldModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.record).toBeTruthy();
    });

    it('JSItemModel context should have element and record properties in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.resource).toBeTruthy();
    });
  });

  describe('Base context metadata', () => {
    it('should have logger property in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.logger).toBeTruthy();
    });

    it('should have message property in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.message).toBeTruthy();
    });

    it('should have api property in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.api).toBeTruthy();
    });

    it('should have t method in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.t).toBeTruthy();
    });

    it('should have requireAsync method in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.requireAsync).toBeTruthy();
    });

    it('should have runAction method in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.runAction).toBeTruthy();
    });

    it('should have openView method in base context', () => {
      const ctx: any = { model: { constructor: { name: '*' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.openView).toBeTruthy();
    });
  });
});
