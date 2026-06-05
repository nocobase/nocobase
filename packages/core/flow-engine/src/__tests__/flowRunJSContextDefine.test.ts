/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowRunJSContext } from '../flowContext';

describe('FlowRunJSContext.define() and getDoc() deep tests', () => {
  // Create test classes for inheritance testing
  class TestBaseContext extends FlowRunJSContext {}
  class TestChildContext extends TestBaseContext {}
  class TestGrandchildContext extends TestChildContext {}

  beforeEach(() => {
    // Clear all caches to ensure clean state for each test
    // @ts-ignore - accessing private WeakMap for testing
    const cache = (FlowRunJSContext as any).__runjsDocCache;
    if (cache) {
      // WeakMaps can't be cleared directly, but we can create new test classes
    }
  });

  describe('Deep merging', () => {
    it('should deep merge nested object properties', () => {
      class MergeTestContext extends FlowRunJSContext {}

      MergeTestContext.define({
        properties: {
          api: {
            description: 'API client',
            properties: {
              request: { description: 'Request method' },
              auth: { description: 'Auth info' },
            },
          },
        },
      });

      MergeTestContext.define({
        properties: {
          api: {
            properties: {
              request: { description: 'Updated request method' },
              query: { description: 'Query method' },
            },
          },
        },
      });

      const doc = MergeTestContext.getDoc();
      expect(doc.properties?.api).toBeTruthy();
      const apiProp: any = doc.properties?.api;
      expect(apiProp.description).toBe('API client');
      expect(apiProp.properties?.request?.description).toBe('Updated request method');
      expect(apiProp.properties?.query?.description).toBe('Query method');
      expect(apiProp.properties?.auth?.description).toBe('Auth info');
    });

    it('should treat string doc as description when overriding object docs', () => {
      class BaseDocContext extends FlowRunJSContext {}
      class ChildDocContext extends BaseDocContext {}

      BaseDocContext.define({
        properties: {
          foo: {
            description: 'Base foo',
            detail: 'FooDetail',
            hidden: true,
            completion: { insertText: 'ctx.foo' },
            properties: {
              bar: { description: 'Bar desc' },
            },
          },
        },
      });

      ChildDocContext.define({
        properties: {
          foo: 'Child foo',
        },
      });

      const doc = ChildDocContext.getDoc();
      const foo: any = doc.properties?.foo;
      expect(foo).toBeTruthy();
      expect(typeof foo).toBe('object');
      expect(foo.description).toBe('Child foo');
      expect(foo.hidden).toBe(true);
      expect(foo.detail).toBe('FooDetail');
      expect(foo.completion?.insertText).toBe('ctx.foo');
      expect(foo.properties?.bar?.description).toBe('Bar desc');
    });

    it('should preserve base string description when patch adds object doc', () => {
      class BaseStringDocContext extends FlowRunJSContext {}
      class ChildObjectDocContext extends BaseStringDocContext {}

      BaseStringDocContext.define({
        properties: {
          foo: 'Base foo',
        },
      });

      ChildObjectDocContext.define({
        properties: {
          foo: {
            properties: {
              bar: 'Bar',
            },
          },
        },
      });

      const doc = ChildObjectDocContext.getDoc();
      const foo: any = doc.properties?.foo;
      expect(foo).toBeTruthy();
      expect(typeof foo).toBe('object');
      expect(foo.description).toBe('Base foo');
      expect(foo.properties?.bar).toBe('Bar');
    });

    it('should deep merge method documentation', () => {
      class MethodMergeContext extends FlowRunJSContext {}

      MethodMergeContext.define({
        methods: {
          runAction: {
            description: 'Run an action',
            completion: { insertText: 'ctx.runAction()' },
          },
        },
      });

      MethodMergeContext.define({
        methods: {
          runAction: {
            description: 'Execute a data action',
            examples: ['ctx.runAction("create", {})'],
          },
        },
      });

      const doc = MethodMergeContext.getDoc();
      const method: any = doc.methods?.runAction;
      expect(method?.description).toBe('Execute a data action');
      expect(method?.completion?.insertText).toBe('ctx.runAction()');
      expect(method?.examples).toEqual(['ctx.runAction("create", {})']);
    });
  });

  describe('Null value property deletion', () => {
    it('should remove property when defined with null', () => {
      class NullTestContext extends FlowRunJSContext {}

      NullTestContext.define({
        properties: {
          foo: 'Foo property',
          bar: 'Bar property',
        },
      });

      NullTestContext.define({
        properties: {
          foo: null as any,
        },
      });

      const doc = NullTestContext.getDoc();
      expect(doc.properties?.foo).toBeUndefined();
      expect(doc.properties?.bar).toBe('Bar property');
    });

    it('should remove nested property when defined with null', () => {
      class NestedNullContext extends FlowRunJSContext {}

      NestedNullContext.define({
        properties: {
          api: {
            description: 'API client',
            properties: {
              request: { description: 'Request' },
              query: { description: 'Query' },
            },
          },
        },
      });

      NestedNullContext.define({
        properties: {
          api: {
            properties: {
              query: null as any,
            },
          },
        },
      });

      const doc = NestedNullContext.getDoc();
      const apiProp: any = doc.properties?.api;
      expect(apiProp.properties?.request?.description).toBe('Request');
      expect(apiProp.properties?.query).toBeUndefined();
    });

    it('should remove method when defined with null', () => {
      class MethodNullContext extends FlowRunJSContext {}

      MethodNullContext.define({
        methods: {
          foo: 'Foo method',
          bar: 'Bar method',
        },
      });

      MethodNullContext.define({
        methods: {
          foo: null as any,
        },
      });

      const doc = MethodNullContext.getDoc();
      expect(doc.methods?.foo).toBeUndefined();
      expect(doc.methods?.bar).toBe('Bar method');
    });
  });

  describe('Inheritance chain merging', () => {
    it('should merge metadata from parent class', () => {
      class InheritBaseContext extends FlowRunJSContext {}
      class InheritChildContext extends InheritBaseContext {}

      InheritBaseContext.define({
        label: 'Base Context',
        properties: {
          baseProp: 'Base property',
        },
      });

      InheritChildContext.define({
        label: 'Child Context',
        properties: {
          childProp: 'Child property',
        },
      });

      const doc = InheritChildContext.getDoc();
      expect(doc.label).toBe('Child Context');
      expect(doc.properties?.baseProp).toBe('Base property');
      expect(doc.properties?.childProp).toBe('Child property');
    });

    it('should merge metadata from entire inheritance chain', () => {
      class ChainBase extends FlowRunJSContext {}
      class ChainMiddle extends ChainBase {}
      class ChainLeaf extends ChainMiddle {}

      ChainBase.define({
        properties: { base: 'base' },
        methods: { baseMethod: 'base method' },
      });

      ChainMiddle.define({
        properties: { middle: 'middle' },
        methods: { middleMethod: 'middle method' },
      });

      ChainLeaf.define({
        properties: { leaf: 'leaf' },
        methods: { leafMethod: 'leaf method' },
      });

      const doc = ChainLeaf.getDoc();
      expect(doc.properties?.base).toBe('base');
      expect(doc.properties?.middle).toBe('middle');
      expect(doc.properties?.leaf).toBe('leaf');
      expect(doc.methods?.baseMethod).toBe('base method');
      expect(doc.methods?.middleMethod).toBe('middle method');
      expect(doc.methods?.leafMethod).toBe('leaf method');
    });

    it('should allow child to override parent properties', () => {
      class OverrideBase extends FlowRunJSContext {}
      class OverrideChild extends OverrideBase {}

      OverrideBase.define({
        properties: {
          shared: 'Base version',
        },
      });

      OverrideChild.define({
        properties: {
          shared: 'Child version',
        },
      });

      const doc = OverrideChild.getDoc();
      expect(doc.properties?.shared).toBe('Child version');
    });

    it('should allow child to remove parent properties with null', () => {
      class RemoveBase extends FlowRunJSContext {}
      class RemoveChild extends RemoveBase {}

      RemoveBase.define({
        properties: {
          toRemove: 'To be removed',
          toKeep: 'To keep',
        },
      });

      RemoveChild.define({
        properties: {
          toRemove: null as any,
        },
      });

      const doc = RemoveChild.getDoc();
      expect(doc.properties?.toRemove).toBeUndefined();
      expect(doc.properties?.toKeep).toBe('To keep');
    });
  });

  describe('Locale-specific metadata', () => {
    it('should support multiple locales', () => {
      class LocaleContext extends FlowRunJSContext {}

      LocaleContext.define({
        label: 'Default Label',
        properties: { message: 'Default message' },
      });

      LocaleContext.define(
        {
          label: 'Chinese Label',
          properties: { message: '中文消息' },
        },
        { locale: 'zh-CN' },
      );

      LocaleContext.define(
        {
          label: 'Japanese Label',
          properties: { message: '日本語メッセージ' },
        },
        { locale: 'ja-JP' },
      );

      const defaultDoc = LocaleContext.getDoc();
      expect(defaultDoc.label).toBe('Default Label');
      expect(defaultDoc.properties?.message).toBe('Default message');

      const zhDoc = LocaleContext.getDoc('zh-CN');
      expect(zhDoc.label).toBe('Chinese Label');
      expect(zhDoc.properties?.message).toBe('中文消息');

      const jaDoc = LocaleContext.getDoc('ja-JP');
      expect(jaDoc.label).toBe('Japanese Label');
      expect(jaDoc.properties?.message).toBe('日本語メッセージ');
    });

    it('should merge locale-specific metadata with default', () => {
      class LocaleMergeContext extends FlowRunJSContext {}

      LocaleMergeContext.define({
        properties: {
          api: 'API client',
          message: 'Message',
        },
      });

      LocaleMergeContext.define(
        {
          properties: {
            message: '消息',
          },
        },
        { locale: 'zh-CN' },
      );

      const zhDoc = LocaleMergeContext.getDoc('zh-CN');
      expect(zhDoc.properties?.api).toBe('API client');
      expect(zhDoc.properties?.message).toBe('消息');
    });

    it('should support locale inheritance', () => {
      class LocaleInheritBase extends FlowRunJSContext {}
      class LocaleInheritChild extends LocaleInheritBase {}

      LocaleInheritBase.define({ properties: { base: 'base' } });
      LocaleInheritBase.define({ properties: { base: '基础' } }, { locale: 'zh-CN' });

      LocaleInheritChild.define({ properties: { child: 'child' } });
      LocaleInheritChild.define({ properties: { child: '子级' } }, { locale: 'zh-CN' });

      const zhDoc = LocaleInheritChild.getDoc('zh-CN');
      expect(zhDoc.properties?.base).toBe('基础');
      expect(zhDoc.properties?.child).toBe('子级');
    });
  });

  describe('Cache behavior', () => {
    it('should cache getDoc results', () => {
      class CacheContext extends FlowRunJSContext {}

      CacheContext.define({
        properties: { foo: 'bar' },
      });

      const doc1 = CacheContext.getDoc();
      const doc2 = CacheContext.getDoc();

      // Should return the same cached object
      expect(doc1).toBe(doc2);
    });

    it('should invalidate cache when define is called', () => {
      class InvalidateContext extends FlowRunJSContext {}

      InvalidateContext.define({
        properties: { foo: 'initial' },
      });

      const doc1 = InvalidateContext.getDoc();
      expect(doc1.properties?.foo).toBe('initial');

      InvalidateContext.define({
        properties: { foo: 'updated' },
      });

      const doc2 = InvalidateContext.getDoc();
      expect(doc2.properties?.foo).toBe('updated');

      // Should be different objects after invalidation
      expect(doc1).not.toBe(doc2);
    });

    it('should cache different locales separately', () => {
      class LocaleCacheContext extends FlowRunJSContext {}

      LocaleCacheContext.define({ properties: { msg: 'English' } });
      LocaleCacheContext.define({ properties: { msg: '中文' } }, { locale: 'zh-CN' });

      const enDoc1 = LocaleCacheContext.getDoc();
      const zhDoc1 = LocaleCacheContext.getDoc('zh-CN');
      const enDoc2 = LocaleCacheContext.getDoc();
      const zhDoc2 = LocaleCacheContext.getDoc('zh-CN');

      expect(enDoc1).toBe(enDoc2);
      expect(zhDoc1).toBe(zhDoc2);
      expect(enDoc1).not.toBe(zhDoc1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty define calls', () => {
      class EmptyContext extends FlowRunJSContext {}

      EmptyContext.define({});
      const doc = EmptyContext.getDoc();

      expect(doc).toBeTruthy();
      expect(typeof doc).toBe('object');
    });

    it('should handle undefined values gracefully', () => {
      class UndefinedContext extends FlowRunJSContext {}

      UndefinedContext.define({
        properties: {
          foo: undefined as any,
        },
      });

      const doc = UndefinedContext.getDoc();
      expect(doc.properties?.foo).toBeUndefined();
    });

    it('should handle arrays in properties', () => {
      class ArrayContext extends FlowRunJSContext {}

      ArrayContext.define({
        properties: {
          examples: ['example1', 'example2'] as any,
        },
      });

      const doc = ArrayContext.getDoc();
      expect(doc.properties?.examples).toEqual(['example1', 'example2']);
    });

    it('should not merge arrays, replace them instead', () => {
      class ArrayReplaceContext extends FlowRunJSContext {}

      ArrayReplaceContext.define({
        properties: {
          items: ['a', 'b'] as any,
        },
      });

      ArrayReplaceContext.define({
        properties: {
          items: ['c', 'd'] as any,
        },
      });

      const doc = ArrayReplaceContext.getDoc();
      expect(doc.properties?.items).toEqual(['c', 'd']);
    });
  });

  describe('Multiple define calls', () => {
    it('should accumulate metadata from multiple define calls', () => {
      class MultiDefineContext extends FlowRunJSContext {}

      MultiDefineContext.define({
        properties: { prop1: 'value1' },
      });

      MultiDefineContext.define({
        properties: { prop2: 'value2' },
      });

      MultiDefineContext.define({
        methods: { method1: 'desc1' },
      });

      const doc = MultiDefineContext.getDoc();
      expect(doc.properties?.prop1).toBe('value1');
      expect(doc.properties?.prop2).toBe('value2');
      expect(doc.methods?.method1).toBe('desc1');
    });

    it('should allow incremental updates to nested structures', () => {
      class IncrementalContext extends FlowRunJSContext {}

      IncrementalContext.define({
        properties: {
          api: {
            description: 'API client',
            properties: {
              request: { description: 'Request method' },
            },
          },
        },
      });

      IncrementalContext.define({
        properties: {
          api: {
            detail: 'APIClient instance',
            properties: {
              query: { description: 'Query method' },
            },
          },
        },
      });

      const doc = IncrementalContext.getDoc();
      const apiProp: any = doc.properties?.api;
      expect(apiProp.description).toBe('API client');
      expect(apiProp.detail).toBe('APIClient instance');
      expect(apiProp.properties?.request?.description).toBe('Request method');
      expect(apiProp.properties?.query?.description).toBe('Query method');
    });
  });
});
