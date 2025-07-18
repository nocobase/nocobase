/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { FlowRuntimeContext } from '../../flowContext';
import { resolveTemplateParams } from '../params-resolvers';

describe('resolveTemplateParams', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let runtimeContext: FlowRuntimeContext<FlowModel>;

  class TestModel extends FlowModel {}

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ TestModel });
    model = engine.createModel({ use: 'TestModel' });
    runtimeContext = new FlowRuntimeContext(model, 'test-flow', 'runtime');

    // 设置一些测试数据
    runtimeContext.defineProperty('testValue', { value: 'Hello World' });
    runtimeContext.defineProperty('number', { value: 42 });
    runtimeContext.defineProperty('object', {
      value: {
        nested: {
          value: 'Nested Value',
        },
      },
    });

    // 添加异步属性
    runtimeContext.defineProperty('asyncValue', {
      get: async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('Async Result'), 10);
        });
      },
    });

    runtimeContext.defineProperty('asyncObject', {
      get: async () => {
        return new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                level1: {
                  level2: 'Deep Async Value',
                },
              }),
            10,
          );
        });
      },
    });

    runtimeContext.defineProperty('nestedAsync', {
      value: {
        sync: 'Sync Value',
        getAsync: async () => {
          return new Promise((resolve) => {
            setTimeout(() => resolve('Nested Async Result'), 10);
          });
        },
      },
    });

    runtimeContext.stepResults = {
      step1: { result: 'Step 1 Result' },
      step2: { data: [1, 2, 3] },
    };
    runtimeContext.defineProperty('inputArgs', {
      value: { userName: 'John Doe' },
    });
  });

  it('should return non-string values as-is', async () => {
    expect(await resolveTemplateParams(42, runtimeContext)).toBe(42);
    expect(await resolveTemplateParams(true, runtimeContext)).toBe(true);
    expect(await resolveTemplateParams(null, runtimeContext)).toBe(null);
    expect(await resolveTemplateParams(undefined, runtimeContext)).toBe(undefined);
  });

  it('should resolve simple template expressions', async () => {
    expect(await resolveTemplateParams('{{ctx.testValue}}', runtimeContext)).toBe('Hello World');
    expect(await resolveTemplateParams('{{ctx.number}}', runtimeContext)).toBe(42);
  });

  it('should resolve nested property access', async () => {
    expect(await resolveTemplateParams('{{ctx.object.nested.value}}', runtimeContext)).toBe('Nested Value');
  });

  it('should resolve step results', async () => {
    expect(await resolveTemplateParams('{{ctx.stepResults.step1.result}}', runtimeContext)).toBe('Step 1 Result');
    expect(await resolveTemplateParams('{{ctx.stepResults.step2.data}}', runtimeContext)).toEqual([1, 2, 3]);
  });

  it('should resolve input arguments', async () => {
    expect(await resolveTemplateParams('{{ctx.inputArgs.userName}}', runtimeContext)).toBe('John Doe');
  });

  it('should resolve templates in objects', async () => {
    const input = {
      message: '{{ctx.testValue}}',
      count: '{{ctx.number}}',
      nested: {
        value: '{{ctx.object.nested.value}}',
      },
    };

    const expected = {
      message: 'Hello World',
      count: 42,
      nested: {
        value: 'Nested Value',
      },
    };

    expect(await resolveTemplateParams(input, runtimeContext)).toEqual(expected);
  });

  it('should resolve templates in arrays', async () => {
    const input = ['{{ctx.testValue}}', '{{ctx.number}}', { message: '{{ctx.object.nested.value}}' }];

    const expected = ['Hello World', 42, { message: 'Nested Value' }];

    expect(await resolveTemplateParams(input, runtimeContext)).toEqual(expected);
  });

  it('should handle deeply nested structures', async () => {
    const input = {
      level1: {
        level2: {
          items: [{ name: '{{ctx.testValue}}' }, { count: '{{ctx.number}}' }],
          value: '{{ctx.stepResults.step1.result}}',
        },
      },
    };

    const expected = {
      level1: {
        level2: {
          items: [{ name: 'Hello World' }, { count: 42 }],
          value: 'Step 1 Result',
        },
      },
    };

    expect(await resolveTemplateParams(input, runtimeContext)).toEqual(expected);
  });

  it('should handle template expressions in mixed content', async () => {
    const input = {
      greeting: 'Hello, {{ctx.inputArgs.userName}}!',
      message: 'The value is {{ctx.number}} and result is {{ctx.stepResults.step1.result}}',
    };

    const result = await resolveTemplateParams(input, runtimeContext);

    // 注意：compileUiSchema 会完全替换整个字符串，而不是部分替换
    // 所以需要检查实际的行为
    expect(typeof result.greeting).toBe('string');
    expect(typeof result.message).toBe('string');
  });

  it('should handle errors gracefully', async () => {
    // 引用不存在的属性时，compileUiSchema 会返回 undefined
    expect(await resolveTemplateParams('{{ctx.nonExistent}}', runtimeContext)).toBe(undefined);

    // 语法错误的模板会保持原样
    expect(await resolveTemplateParams('{{invalid syntax', runtimeContext)).toBe('{{invalid syntax');

    // 无效的表达式会保持原样
    expect(await resolveTemplateParams('{not a template}', runtimeContext)).toBe('{not a template}');
  });

  it('should preserve non-template properties', async () => {
    const input = {
      template: '{{ctx.testValue}}',
      normal: 'Just a string',
      number: 123,
      boolean: true,
      array: [1, 2, 3],
    };

    const result = await resolveTemplateParams(input, runtimeContext);

    expect(result.template).toBe('Hello World');
    expect(result.normal).toBe('Just a string');
    expect(result.number).toBe(123);
    expect(result.boolean).toBe(true);
    expect(result.array).toEqual([1, 2, 3]);
  });

  it('should resolve async properties', async () => {
    // 直接异步属性
    expect(await resolveTemplateParams('{{ctx.asyncValue}}', runtimeContext)).toBe('Async Result');

    // 异步对象的嵌套属性
    expect(await resolveTemplateParams('{{ctx.asyncObject.level1.level2}}', runtimeContext)).toBe('Deep Async Value');
  });

  it('should resolve templates with async properties in objects', async () => {
    const input = {
      syncValue: '{{ctx.testValue}}',
      asyncValue: '{{ctx.asyncValue}}',
      nestedAsync: '{{ctx.asyncObject.level1.level2}}',
      mixed: {
        sync: '{{ctx.number}}',
        async: '{{ctx.asyncValue}}',
      },
    };

    const result = await resolveTemplateParams(input, runtimeContext);

    expect(result.syncValue).toBe('Hello World');
    expect(result.asyncValue).toBe('Async Result');
    expect(result.nestedAsync).toBe('Deep Async Value');
    expect(result.mixed.sync).toBe(42);
    expect(result.mixed.async).toBe('Async Result');
  });

  it('should resolve templates with async properties in arrays', async () => {
    const input = ['{{ctx.asyncValue}}', { value: '{{ctx.asyncObject.level1.level2}}' }, '{{ctx.testValue}}'];

    const result = await resolveTemplateParams(input, runtimeContext);

    expect(result[0]).toBe('Async Result');
    expect(result[1].value).toBe('Deep Async Value');
    expect(result[2]).toBe('Hello World');
  });

  it('should handle complex async scenarios', async () => {
    // 定义一个返回 Promise 的属性，该 Promise 解析为一个对象
    // 该对象包含另一个返回 Promise 的方法
    runtimeContext.defineProperty('complexAsync', {
      get: async () => {
        return {
          data: 'Direct Data',
          getMoreData: async () => {
            return new Promise((resolve) => {
              setTimeout(
                () =>
                  resolve({
                    finalValue: 'Complex Async Final',
                  }),
                10,
              );
            });
          },
        };
      },
    });

    // 测试多层异步
    const result1 = await resolveTemplateParams('{{ctx.complexAsync.data}}', runtimeContext);
    expect(result1).toBe('Direct Data');

    // 注意：由于我们的实现限制，无法调用异步方法，只能访问属性
    // 这是预期的行为
  });

  it('should handle mixed sync and async property chains', async () => {
    // 创建一个混合同步和异步的属性链
    runtimeContext.defineProperty('mixedChain', {
      get: async () => ({
        sync1: {
          get: async () => ({
            sync2: 'Final Value',
          }),
        },
      }),
    });

    const result = await resolveTemplateParams('{{ctx.mixedChain.sync1.sync2}}', runtimeContext);
    expect(result).toEqual('Final Value');
  });
});
