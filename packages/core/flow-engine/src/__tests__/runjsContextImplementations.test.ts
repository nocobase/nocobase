/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { RunJSContextRegistry, getRunJSDocFor } from '..';
import { FlowContext } from '../flowContext';
import { setupRunJSContexts } from '../runjs-context/setup';

describe('Specific RunJSContext implementations', () => {
  beforeAll(async () => {
    await setupRunJSContexts();
  });

  describe('JSColumnRunJSContext', () => {
    it('should be registered for JSColumnModel', () => {
      const ctor = RunJSContextRegistry['resolve']('v1' as any, 'JSColumnModel');
      expect(ctor).toBeTruthy();
    });

    it('should have element property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.element).toContain('ElementProxy');
    });

    it('should have record property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.record).toBeTruthy();
      const recordDoc: any = doc?.properties?.record;
      expect(String(recordDoc?.description ?? recordDoc ?? '')).toContain('row record');
    });

    it('should have recordIndex property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.recordIndex).toBeTruthy();
    });

    it('should have collection property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.collection).toBeTruthy();
    });

    it('should have viewer property in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.viewer).toBeTruthy();
    });

    it('should have onRefReady method in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSColumnModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.onRefReady).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSColumnModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/JS 列/);
      expect(doc?.properties?.element).toContain('表格单元格');
    });

    it('should create instance successfully', () => {
      const ctor = RunJSContextRegistry['resolve']('v1' as any, 'JSColumnModel');
      const baseCtx = new FlowContext();
      const instance = new (ctor as any)(baseCtx);
      expect(instance).toBeTruthy();
    });
  });

  describe('JSBlockRunJSContext', () => {
    it('should have React and antd in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.React).toBeTruthy();
      expect(doc?.properties?.antd).toBeTruthy();
    });

    it('should have ctx.auth.locale / ctx.viewer.drawer in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });

      expect(doc?.properties?.auth?.properties?.locale).toBeTruthy();
      expect(doc?.properties?.viewer?.properties?.drawer).toBeTruthy();
    });

    it('should have element property', () => {
      const ctx: any = { model: { constructor: { name: 'JSBlockModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSBlockModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toContain('RunJS');
    });
  });

  describe('JSFieldRunJSContext', () => {
    it('should have record, value, and collection properties', () => {
      const ctx: any = { model: { constructor: { name: 'JSFieldModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.record).toBeTruthy();
      expect(doc?.properties?.value).toBeTruthy();
      expect(doc?.properties?.collection).toBeTruthy();
    });

    it('should have element property', () => {
      const ctx: any = { model: { constructor: { name: 'JSFieldModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSFieldModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/JS 字段/);
    });
  });

  describe('JSItemRunJSContext', () => {
    it('should have element and record properties', () => {
      const ctx: any = { model: { constructor: { name: 'JSItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
    });

    it('should have resource property', () => {
      const ctx: any = { model: { constructor: { name: 'JSItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.resource).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSItemModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/JS 表单项/);
    });
  });

  describe('JSRecordActionRunJSContext', () => {
    it('should have record property', () => {
      const ctx: any = { model: { constructor: { name: 'JSRecordActionModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.record).toBeTruthy();
    });

    it('should have filterByTk property', () => {
      const ctx: any = { model: { constructor: { name: 'JSRecordActionModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.filterByTk).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSRecordActionModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/JS 记录动作/);
    });
  });

  describe('JSCollectionActionRunJSContext', () => {
    it('should have resource property', () => {
      const ctx: any = { model: { constructor: { name: 'JSCollectionActionModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.resource).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSCollectionActionModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/JS 集合动作/);
    });
  });

  describe('FormJSFieldItemRunJSContext', () => {
    it('should have element property', () => {
      const ctx: any = { model: { constructor: { name: 'FormJSFieldItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.element).toBeTruthy();
    });

    it('should have value and record properties', () => {
      const ctx: any = { model: { constructor: { name: 'FormJSFieldItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.properties?.value).toBeTruthy();
      expect(doc?.properties?.record).toBeTruthy();
    });

    it('should have setProps method', () => {
      const ctx: any = { model: { constructor: { name: 'FormJSFieldItemModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.setProps).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'FormJSFieldItemModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/表单 JS 字段项/);
    });
  });

  describe('JSEditableFieldRunJSContext', () => {
    it('should be registered for JSEditableFieldModel', () => {
      const ctor = RunJSContextRegistry['resolve']('v1' as any, 'JSEditableFieldModel');
      expect(ctor).toBeTruthy();
    });

    it('should have getValue/setValue methods in doc', () => {
      const ctx: any = { model: { constructor: { name: 'JSEditableFieldModel' } } };
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.methods?.getValue).toBeTruthy();
      expect(doc?.methods?.setValue).toBeTruthy();
    });

    it('should support zh-CN locale', () => {
      const ctx = new FlowContext();
      (ctx as any).defineProperty('model', { value: { constructor: { name: 'JSEditableFieldModel' } } });
      (ctx as any).defineProperty('api', { value: { auth: { locale: 'zh-CN' } } });
      const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
      expect(doc?.label).toMatch(/可编辑字段/);
    });
  });
});
