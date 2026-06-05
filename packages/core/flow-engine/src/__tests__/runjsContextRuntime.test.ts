/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { createJSRunnerWithVersion, getRunJSDocFor } from '..';
import { FlowContext } from '../flowContext';
import { setupRunJSContexts } from '../runjs-context/setup';

describe('RunJS Context Runtime Behavior', () => {
  beforeAll(async () => {
    await setupRunJSContexts();
  });

  describe('JSBlockRunJSContext', () => {
    it('should create JSBlock context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have element property in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.React).toBeTruthy();
      expect(doc?.properties?.antd).toBeTruthy();
    });

    it('should have onRefReady method in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.methods?.onRefReady).toBeTruthy();
      expect(doc?.methods?.requireAsync).toBeTruthy();
    });
  });

  describe('JSFieldRunJSContext', () => {
    it('should create JSField context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have field-specific properties in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSFieldModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.value).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.collection).toBeTruthy();
    });
  });

  describe('JSItemRunJSContext', () => {
    it('should create JSItem context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSItemModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have item-specific properties in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.resource).toBeTruthy();
    });
  });

  describe('JSColumnRunJSContext', () => {
    it('should create JSColumn context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSColumnModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have column-specific properties in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.recordIndex).toBeTruthy();
      expect(doc?.properties?.collection).toBeTruthy();
      expect(doc?.properties?.viewer).toBeTruthy();
    });
  });

  describe('FormJSFieldItemRunJSContext', () => {
    it('should create FormJSFieldItem context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'FormJSFieldItemModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have form field-specific properties and methods in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'FormJSFieldItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.value).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.methods?.setProps).toBeTruthy();
    });
  });

  describe('JSRecordActionRunJSContext', () => {
    it('should create JSRecordAction context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSRecordActionModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have record action-specific properties in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSRecordActionModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.filterByTk).toBeTruthy();
    });
  });

  describe('JSCollectionActionRunJSContext', () => {
    it('should create JSCollectionAction context successfully', async () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSCollectionActionModel' } } });

      const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
      const result = await runner.run('return typeof ctx !== "undefined"');

      expect(result?.success).toBe(true);
      expect(result?.value).toBe(true);
    });

    it('should have collection action-specific properties in documentation', () => {
      const ctx: any = { model: { constructor: { name: 'JSCollectionActionModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.resource).toBeTruthy();
    });
  });

  describe('Cross-context features', () => {
    it('should provide React and antd in all contexts', async () => {
      const contextTypes = [
        'JSBlockModel',
        'JSFieldModel',
        'JSItemModel',
        'JSColumnModel',
        'FormJSFieldItemModel',
        'JSRecordActionModel',
        'JSCollectionActionModel',
      ];

      for (const modelName of contextTypes) {
        const ctx = new FlowContext();
        ctx.defineProperty('model', { value: { constructor: { name: modelName } } });

        const runner = createJSRunnerWithVersion.call(ctx, { version: 'v1' });
        const result = await runner.run(`
          return {
            hasReact: typeof ctx.React !== "undefined",
            hasAntd: typeof ctx.antd !== "undefined",
            hasReactDOM: typeof ctx.ReactDOM !== "undefined"
          }
        `);

        expect(result?.success).toBe(true);
        expect(result?.value).toEqual({
          hasReact: true,
          hasAntd: true,
          hasReactDOM: true,
        });
      }
    });

    it('should access base context properties in documentation', () => {
      const contextTypes = ['JSBlockModel', 'JSFieldModel', 'JSColumnModel'];

      for (const modelName of contextTypes) {
        const ctx: any = { model: { constructor: { name: modelName } } };
        const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

        // Base properties from FlowRunJSContext
        expect(doc?.properties?.logger).toBeTruthy();
        expect(doc?.properties?.message).toBeTruthy();
        expect(doc?.methods?.request).toBeTruthy();
        expect(doc?.methods?.t).toBeTruthy();
        expect(doc?.methods?.requireAsync).toBeTruthy();
      }
    });
  });

  describe('Documentation completeness', () => {
    it('should provide complete documentation for all context types', () => {
      const contextTypes = [
        'JSBlockModel',
        'JSFieldModel',
        'JSItemModel',
        'JSColumnModel',
        'FormJSFieldItemModel',
        'JSRecordActionModel',
        'JSCollectionActionModel',
      ];

      for (const modelName of contextTypes) {
        const ctx: any = { model: { constructor: { name: modelName } } };
        const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

        expect(doc).toBeTruthy();
        expect(doc?.label).toBeTruthy();
        expect(doc?.properties).toBeTruthy();
        expect(typeof doc?.properties).toBe('object');
      }
    });

    it('should provide locale-specific documentation', () => {
      const ctx = new FlowContext();
      ctx.defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });
      ctx.defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });

      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc).toBeTruthy();
      // Should have Chinese documentation
      expect(doc?.label).toContain('JS');
    });
  });
});
