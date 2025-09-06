/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getT,
  isInheritedFrom,
  resolveDefaultParams,
  resolveStepUiSchema,
  FlowExitException,
  defineAction,
  compileUiSchema,
  resolveCreateModelOptions as resolveDefaultOptions,
  FLOW_ENGINE_NAMESPACE,
} from '../index';
import { FlowModel } from '../../models/flowModel';
import { FlowEngine } from '../../flowEngine';
import type {
  FlowDefinitionOptions,
  ActionDefinition,
  DeepPartial,
  ModelConstructor,
  StepParams,
  StepDefinition,
} from '../../types';
import { FlowRuntimeContext } from '../../flowContext';

// Helper functions
const createMockFlowEngine = (): FlowEngine => {
  return new FlowEngine();
};

interface MockFlowModelOptions {
  uid?: string;
  flowEngine?: FlowEngine;
  stepParams?: StepParams;
  sortIndex?: number;
  subModels?: Record<string, FlowModel | FlowModel[]>;
  use?: string;
}

const createMockFlowModel = (overrides: MockFlowModelOptions = {}): FlowModel => {
  const flowEngine = overrides.flowEngine || createMockFlowEngine();
  const options = {
    uid: 'test-model-uid',
    use: 'FlowModel',
    stepParams: {},
    sortIndex: 0,
    subModels: {},
    ...overrides,
  };

  const model = flowEngine.createModel(options);

  // Mock additional methods for testing
  flowEngine.translate = vi.fn((key: string, options?: Record<string, unknown>) => {
    if (options?.returnOriginal) return key;
    return `translated_${key}`;
  });

  flowEngine.getAction = vi.fn().mockReturnValue(null);

  return model;
};

// Test setup
let mockModel: FlowModel;
let mockFlowEngine: FlowEngine;

beforeEach(() => {
  mockFlowEngine = createMockFlowEngine();
  mockModel = createMockFlowModel({ flowEngine: mockFlowEngine });
  vi.clearAllMocks();
});

describe('Utils', () => {
  // ==================== getT() FUNCTION ====================
  describe('getT()', () => {
    describe('basic translation functionality', () => {
      test('should return translation function when flowEngine.translate exists', () => {
        const translateFn = getT(mockModel);

        expect(typeof translateFn).toBe('function');
      });

      test('should call flowEngine.translate with correct parameters', () => {
        const translateFn = getT(mockModel);

        translateFn('test.key', { custom: 'option' });

        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('test.key', {
          ns: [FLOW_ENGINE_NAMESPACE, 'client'],
          nsMode: 'fallback',
          custom: 'option',
        });
      });

      test('should return translated result from flowEngine', () => {
        const translateFn = getT(mockModel);

        const result = translateFn('hello.world');

        expect(result).toBe('translated_hello.world');
      });
    });

    describe('namespace handling', () => {
      test('should add flow-engine namespace by default', () => {
        const translateFn = getT(mockModel);

        translateFn('key');

        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('key', {
          ns: [FLOW_ENGINE_NAMESPACE, 'client'],
          nsMode: 'fallback',
        });
      });

      test('should merge with existing options', () => {
        const translateFn = getT(mockModel);

        translateFn('key', { ns: ['custom'], extraOption: 'value' });

        // The implementation spreads options after defaults, so options override defaults
        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('key', {
          ns: ['custom'], // options.ns overrides default ns
          nsMode: 'fallback',
          extraOption: 'value',
        });
      });

      test('should allow nsMode override', () => {
        const translateFn = getT(mockModel);

        translateFn('key', { nsMode: 'strict' });

        // The implementation spreads options after defaults, so options override defaults
        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('key', {
          ns: [FLOW_ENGINE_NAMESPACE, 'client'],
          nsMode: 'strict', // options.nsMode overrides default nsMode
        });
      });
    });

    describe('fallback mechanism', () => {
      test('should return fallback function when no flowEngine', () => {
        const modelWithoutEngine = { flowEngine: null } as unknown as FlowModel;

        const translateFn = getT(modelWithoutEngine);

        expect(typeof translateFn).toBe('function');
        expect(translateFn('test.key')).toBe('test.key');
      });

      test('should return fallback function when no translate method', () => {
        const modelWithoutTranslate = {
          flowEngine: { translate: null },
        } as unknown as FlowModel;

        const translateFn = getT(modelWithoutTranslate);

        expect(translateFn('test.key')).toBe('test.key');
      });
    });

    describe('error handling', () => {
      test('should handle translate method throwing errors', () => {
        mockModel.flowEngine.translate = vi.fn(() => {
          throw new Error('Translation error');
        });

        expect(() => {
          const translateFn = getT(mockModel);
          translateFn('test.key');
        }).toThrow('Translation error');
      });

      test('should handle null options parameter', () => {
        const translateFn = getT(mockModel);

        translateFn('key', null);

        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('key', {
          ns: [FLOW_ENGINE_NAMESPACE, 'client'],
          nsMode: 'fallback',
        });
      });

      test('should handle undefined options parameter', () => {
        const translateFn = getT(mockModel);

        translateFn('key');

        expect(mockModel.flowEngine.translate).toHaveBeenCalledWith('key', {
          ns: [FLOW_ENGINE_NAMESPACE, 'client'],
          nsMode: 'fallback',
        });
      });
    });
  });

  // ==================== isInheritedFrom() FUNCTION ====================
  describe('isInheritedFrom()', () => {
    let BaseClass: ModelConstructor;
    let MiddleClass: ModelConstructor;
    let DerivedClass: ModelConstructor;
    let UnrelatedClass: ModelConstructor;

    beforeEach(() => {
      BaseClass = class extends FlowModel {} as ModelConstructor;
      MiddleClass = class MiddleClass extends BaseClass {} as ModelConstructor;
      DerivedClass = class DerivedClass extends MiddleClass {} as ModelConstructor;
      UnrelatedClass = class extends FlowModel {} as ModelConstructor;
    });

    describe('basic inheritance checking', () => {
      test('should return true for direct inheritance', () => {
        const result = isInheritedFrom(MiddleClass, BaseClass);

        expect(result).toBe(true);
      });

      test('should return false for same class', () => {
        const result = isInheritedFrom(BaseClass, BaseClass);

        expect(result).toBe(false);
      });

      test('should return false for unrelated classes', () => {
        const result = isInheritedFrom(UnrelatedClass, BaseClass);

        expect(result).toBe(false);
      });
    });

    describe('multi-level inheritance', () => {
      test('should return true for multi-level inheritance', () => {
        const result = isInheritedFrom(DerivedClass, BaseClass);

        expect(result).toBe(true);
      });

      test('should return true for immediate parent', () => {
        const result = isInheritedFrom(DerivedClass, MiddleClass);

        expect(result).toBe(true);
      });

      test('should handle deep inheritance chains', () => {
        class Level1 extends DerivedClass {}
        class Level2 extends Level1 {}
        class Level3 extends Level2 {}

        expect(isInheritedFrom(Level3 as unknown as ModelConstructor, BaseClass)).toBe(true);
        expect(isInheritedFrom(Level3 as unknown as ModelConstructor, MiddleClass)).toBe(true);
        expect(isInheritedFrom(Level3 as unknown as ModelConstructor, DerivedClass)).toBe(true);
        expect(isInheritedFrom(Level3 as unknown as ModelConstructor, Level2 as unknown as ModelConstructor)).toBe(
          true,
        );
      });
    });

    describe('prototype chain validation', () => {
      test('should traverse prototype chain correctly', () => {
        // Create a complex inheritance chain
        const A = class extends FlowModel {} as ModelConstructor;
        const B = class B extends A {} as ModelConstructor;
        const C = class C extends B {} as ModelConstructor;
        const D = class D extends C {} as ModelConstructor;

        expect(isInheritedFrom(D, C)).toBe(true);
        expect(isInheritedFrom(D, B)).toBe(true);
        expect(isInheritedFrom(D, A)).toBe(true);
        expect(isInheritedFrom(C, A)).toBe(true);
        expect(isInheritedFrom(B, A)).toBe(true);
      });

      test('should handle null prototype correctly', () => {
        const NullProtoClass = function () {} as unknown as ModelConstructor;
        Object.setPrototypeOf((NullProtoClass as unknown as { prototype: unknown }).prototype, null);

        expect(() => {
          isInheritedFrom(NullProtoClass, BaseClass);
        }).not.toThrow();
      });
    });
  });

  // ==================== resolveDefaultParams() FUNCTION ====================
  describe('resolveDefaultParams()', () => {
    let mockContext: FlowRuntimeContext<FlowModel>;

    beforeEach(() => {
      mockContext = new FlowRuntimeContext(mockModel, 'testFlow', 'runtime');
      mockContext.defineProperty('inputArgs', { value: { testExtra: 'testExtra' } });
    });

    describe('static parameter resolution', () => {
      test('should return static object directly', async () => {
        const staticParams = { param1: 'value1', param2: 'value2' };

        const result = await resolveDefaultParams(staticParams, mockContext);

        expect(result).toEqual(staticParams);
      });

      test('should return empty object for undefined params', async () => {
        const result = await resolveDefaultParams(undefined, mockContext);

        expect(result).toEqual({});
      });

      test('should return empty object for null params', async () => {
        const result = await resolveDefaultParams(null, mockContext);

        expect(result).toEqual({});
      });

      test('should handle complex static objects', async () => {
        const complexParams = {
          user: { name: 'John', age: 30 },
          settings: { theme: 'dark', notifications: true },
          array: [1, 2, 3],
        };

        const result = await resolveDefaultParams(complexParams, mockContext);

        expect(result).toEqual(complexParams);
      });
    });

    describe('function parameter resolution', () => {
      test('should call function with context and return result', async () => {
        const paramsFn = vi.fn().mockReturnValue({ dynamic: 'value' });

        const result = await resolveDefaultParams(paramsFn, mockContext);

        expect(paramsFn).toHaveBeenCalledWith(mockContext);
        expect(result).toEqual({ dynamic: 'value' });
      });

      test('should handle function accessing context properties', async () => {
        const paramsFn = vi.fn((ctx: FlowRuntimeContext<FlowModel>) => ({
          modelUid: ctx.model.uid,
          extraData: ctx.inputArgs.testExtra,
        }));

        const result = await resolveDefaultParams(paramsFn, mockContext);

        expect(result).toEqual({
          modelUid: mockModel.uid,
          extraData: 'testExtra',
        });
      });
    });

    describe('async processing', () => {
      test('should handle async function correctly', async () => {
        const asyncParamsFn = vi.fn().mockResolvedValue({ async: 'result' });

        const result = await resolveDefaultParams(asyncParamsFn, mockContext);

        expect(asyncParamsFn).toHaveBeenCalledWith(mockContext);
        expect(result).toEqual({ async: 'result' });
      });

      test('should handle async function with delay', async () => {
        const asyncParamsFn = vi.fn(
          () => new Promise((resolve) => setTimeout(() => resolve({ delayed: 'value' }), 10)),
        );

        const result = await resolveDefaultParams(asyncParamsFn, mockContext);

        expect(result).toEqual({ delayed: 'value' });
      });
    });
  });

  // ==================== FlowExitException CLASS ====================
  describe('FlowExitException', () => {
    describe('constructor', () => {
      test('should create exception with all parameters', () => {
        const exception = new FlowExitException('testFlow', 'model-123', 'Custom exit message');

        expect(exception.flowKey).toBe('testFlow');
        expect(exception.modelUid).toBe('model-123');
        expect(exception.message).toBe('Custom exit message');
        expect(exception.name).toBe('FlowExitException');
      });

      test('should create exception with default message', () => {
        const exception = new FlowExitException('testFlow', 'model-123');

        expect(exception.flowKey).toBe('testFlow');
        expect(exception.modelUid).toBe('model-123');
        expect(exception.message).toBe("Flow 'testFlow' on model 'model-123' exited via ctx.exit().");
        expect(exception.name).toBe('FlowExitException');
      });

      test('should create exception with empty string message', () => {
        const exception = new FlowExitException('testFlow', 'model-123', '');

        // Empty string is falsy, so the default message is used in the constructor
        expect(exception.message).toBe("Flow 'testFlow' on model 'model-123' exited via ctx.exit().");
      });
    });

    describe('property access', () => {
      test('should have readonly properties accessible', () => {
        const exception = new FlowExitException('flowKey', 'modelUid');

        expect(exception.flowKey).toBe('flowKey');
        expect(exception.modelUid).toBe('modelUid');
      });
    });
  });

  // ==================== defineAction() FUNCTION ====================
  describe('defineAction()', () => {
    describe('basic functionality', () => {
      test('should return action definition unchanged', () => {
        const actionDef: ActionDefinition = {
          name: 'testAction',
          handler: vi.fn(),
        };

        const result = defineAction(actionDef);

        expect(result).toBe(actionDef);
        expect(result).toEqual(actionDef);
      });

      test('should handle complex action definition', () => {
        const complexAction: ActionDefinition = {
          name: 'complexAction',
          handler: vi.fn().mockResolvedValue('result'),
          defaultParams: { param1: 'value1' },
          uiSchema: {
            field1: { type: 'string', title: 'Field 1' },
          },
        };

        const result = defineAction(complexAction);

        expect(result).toBe(complexAction);
        expect(result.name).toBe('complexAction');
        expect(result.defaultParams).toEqual({ param1: 'value1' });
        expect(result.uiSchema).toEqual({
          field1: { type: 'string', title: 'Field 1' },
        });
      });
    });
  });

  // ==================== compileUiSchema() FUNCTION ====================
  describe('compileUiSchema()', () => {
    let mockScope: Record<string, unknown>;

    beforeEach(() => {
      mockScope = {
        t: vi.fn((key: string) => `translated_${key}`),
        randomString: vi.fn(() => 'random123'),
        user: { name: 'John', role: 'admin' },
      };
    });

    describe('expression compilation', () => {
      test('should compile simple expressions', () => {
        const result = compileUiSchema(mockScope, "{{ t('Hello World') }}");

        expect(mockScope.t).toHaveBeenCalledWith('Hello World');
        expect(typeof result).toBe('string');
      });

      test('should compile expressions with variables', () => {
        const result = compileUiSchema(mockScope, '{{ user.name }}');

        expect(result).toBe('John');
      });

      test('should compile complex expressions', () => {
        const result = compileUiSchema(mockScope, "{{ user.role === 'admin' ? 'Administrator' : 'User' }}");

        expect(result).toBe('Administrator');
      });

      test('should handle non-expression strings', () => {
        const result = compileUiSchema(mockScope, 'Plain string without expressions');

        expect(result).toBe('Plain string without expressions');
      });
    });

    describe('caching mechanism', () => {
      test('should cache compiled results', () => {
        const schema = "{{ t('Cached Test') }}";

        const result1 = compileUiSchema(mockScope, schema);
        const result2 = compileUiSchema(mockScope, schema);

        expect(result1).toBe(result2);
        // Schema.compile should be called once and then cached
        expect(mockScope.t).toHaveBeenCalledTimes(1);
      });

      test('should bypass cache when noCache option is true', () => {
        const schema = "{{ t('No Cache Test') }}";

        compileUiSchema(mockScope, schema, { noCache: false });
        compileUiSchema(mockScope, schema, { noCache: true });

        // t function should be called twice when bypassing cache
        expect(mockScope.t).toHaveBeenCalledTimes(2);
      });

      test('should cache object compilations', () => {
        const schema = {
          title: "{{ t('Object Title') }}",
          description: 'Static description',
        };

        const result1 = compileUiSchema(mockScope, schema);
        const result2 = compileUiSchema(mockScope, schema);

        expect(result1).toBe(result2);
        expect(result1.title).toBeDefined();
        expect(result1.description).toBe('Static description');
      });

      test('should cache array compilations', () => {
        const schema = [{ title: "{{ t('Item 1') }}" }, { title: "{{ t('Item 2') }}" }];

        const result1 = compileUiSchema(mockScope, schema);
        const result2 = compileUiSchema(mockScope, schema);

        expect(result1).toBe(result2);
        expect(Array.isArray(result1)).toBe(true);
        expect(result1).toHaveLength(2);
      });
    });

    describe('object compilation', () => {
      test('should compile objects with template strings', () => {
        const schema = {
          title: "{{ t('Form Title') }}",
          description: 'Static description',
          user: '{{ user.name }}',
          role: '{{ user.role }}',
        };

        const result = compileUiSchema(mockScope, schema);

        expect(typeof result.title).toBe('string');
        expect(result.description).toBe('Static description');
        expect(result.user).toBe('John');
        expect(result.role).toBe('admin');
      });

      test('should handle nested objects', () => {
        const schema = {
          form: {
            title: "{{ t('Nested Form') }}",
            fields: {
              username: {
                label: "{{ t('Username') }}",
                placeholder: "{{ t('Enter username') }}",
              },
            },
          },
        };

        const result = compileUiSchema(mockScope, schema);

        expect(typeof result.form.title).toBe('string');
        expect(typeof result.form.fields.username.label).toBe('string');
        expect(typeof result.form.fields.username.placeholder).toBe('string');
      });

      test('should handle arrays within objects', () => {
        const schema = {
          items: [
            { title: "{{ t('Item 1') }}", value: 1 },
            { title: "{{ t('Item 2') }}", value: 2 },
          ],
          metadata: {
            count: "{{ user.role === 'admin' ? 'unlimited' : '10' }}",
          },
        };

        const result = compileUiSchema(mockScope, schema);

        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].value).toBe(1);
        expect(result.items[1].value).toBe(2);
        expect(result.metadata.count).toBe('unlimited');
      });

      test('should preserve non-template properties', () => {
        const schema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: "{{ t('Name Field') }}",
              maxLength: 100,
            },
          },
        };

        const result = compileUiSchema(mockScope, schema);

        expect(result.type).toBe('object');
        expect(result.properties.name.type).toBe('string');
        expect(typeof result.properties.name.title).toBe('string');
        expect(result.properties.name.maxLength).toBe(100);
      });
    });
  });

  // ==================== resolveDefaultOptions() FUNCTION ====================
  describe('resolveDefaultOptions()', () => {
    describe('static options resolution', () => {
      test('should return static object directly', async () => {
        const staticOptions = { option1: 'value1', option2: 'value2' };

        const result = await resolveDefaultOptions(staticOptions, mockModel.context);

        expect(result).toEqual(staticOptions);
      });

      test('should return empty object for undefined options', async () => {
        const result = await resolveDefaultOptions(undefined, mockModel.context);

        expect(result).toEqual({});
      });

      test('should return empty object for null options', async () => {
        const result = await resolveDefaultOptions(null, mockModel.context);

        expect(result).toEqual({});
      });

      test('should handle complex static objects', async () => {
        const complexOptions = {
          use: 'TableModel',
          config: {
            columns: ['id', 'name'],
            pagination: true,
          },
          stepParams: {
            default: {
              step1: { dataSourceKey: 'main' },
            },
          },
        };

        const result = await resolveDefaultOptions(complexOptions, mockModel.context);

        expect(result).toEqual(complexOptions);
      });
    });

    describe('function options resolution', () => {
      test('should call function with parent model and return result', async () => {
        const optionsFn = vi.fn().mockReturnValue({ dynamic: 'value' });

        const result = await resolveDefaultOptions(optionsFn, mockModel.context);

        expect(optionsFn).toHaveBeenCalledWith(mockModel.context, undefined);
        expect(result).toEqual({ dynamic: 'value' });
      });

      test('should handle function accessing model properties', async () => {
        const optionsFn = vi.fn((parentContext: any) => ({
          use: 'DynamicModel',
          parentUid: parentContext.model.uid,
          sortIndex: parentContext.model.sortIndex || 0,
        }));

        const result = await resolveDefaultOptions(optionsFn, mockModel.context);

        expect(result).toEqual({
          use: 'DynamicModel',
          parentUid: mockModel.uid,
          sortIndex: 0,
        });
      });

      test('should handle async function correctly', async () => {
        const asyncOptionsFn = vi.fn().mockResolvedValue({ async: 'result' });

        const result = await resolveDefaultOptions(asyncOptionsFn, mockModel.context);

        expect(asyncOptionsFn).toHaveBeenCalledWith(mockModel.context, undefined);
        expect(result).toEqual({ async: 'result' });
      });

      test('should handle async function with delay', async () => {
        const asyncOptionsFn = vi.fn(
          () => new Promise((resolve) => setTimeout(() => resolve({ delayed: 'value' }), 10)),
        );

        const result = await resolveDefaultOptions(asyncOptionsFn, mockModel.context);

        expect(result).toEqual({ delayed: 'value' });
      });
    });

    describe('error handling', () => {
      test('should handle function throwing errors and return empty object', async () => {
        const errorFn = vi.fn(() => {
          throw new Error('Options generation error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await resolveDefaultOptions(errorFn, mockModel.context);

        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving createModelOptions function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle async function rejection and return empty object', async () => {
        const rejectFn = vi.fn().mockRejectedValue(new Error('Async error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await resolveDefaultOptions(rejectFn, mockModel.context);

        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving createModelOptions function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle function returning null and convert to empty object', async () => {
        const nullFn = vi.fn().mockReturnValue(null);

        const result = await resolveDefaultOptions(nullFn, mockModel.context);

        expect(result).toEqual({});
      });

      test('should handle function returning undefined and convert to empty object', async () => {
        const undefinedFn = vi.fn().mockReturnValue(undefined);

        const result = await resolveDefaultOptions(undefinedFn, mockModel.context);

        expect(result).toEqual({});
      });
    });
  });

  // ==================== resolveStepUiSchema() FUNCTION ====================
  describe('resolveStepUiSchema()', () => {
    let mockFlow: any;
    let mockStep: StepDefinition;
    let mockAction: any;

    beforeEach(() => {
      mockFlow = {
        key: 'testFlow',
        title: 'Test Flow',
        steps: {
          testStep: {
            handler: vi.fn(),
          },
        },
      };

      mockStep = {
        handler: vi.fn().mockResolvedValue('step-result'),
        title: 'Test Step',
      };

      mockAction = {
        name: 'testAction',
        handler: vi.fn().mockResolvedValue('action-result'),
        title: 'Test Action',
      };
    });

    describe('basic functionality', () => {
      test('should return null when no uiSchema is available', async () => {
        // Step with no uiSchema and no action
        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toBeNull();
      });

      test('should return null when step and action both have empty uiSchema', async () => {
        mockStep.uiSchema = {};
        mockAction.uiSchema = {};
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toBeNull();
      });

      test('should return step uiSchema when only step has uiSchema', async () => {
        const stepUiSchema = {
          field1: { type: 'string', title: 'Field 1' },
          field2: { type: 'number', title: 'Field 2' },
        };
        mockStep.uiSchema = stepUiSchema;

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual(stepUiSchema);
      });

      test('should return action uiSchema when only action has uiSchema', async () => {
        const actionUiSchema = {
          actionField: { type: 'string', title: 'Action Field' },
        };
        mockAction.uiSchema = actionUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual(actionUiSchema);
      });
    });

    describe('merging behavior', () => {
      test('should return step uiSchema when both step and action have uiSchema', async () => {
        const actionUiSchema = {
          field1: { type: 'string', title: 'Action Field 1' },
          field2: { type: 'number', title: 'Action Field 2' },
        };
        const stepUiSchema = {
          field1: { type: 'string', title: 'Step Field 1' }, // Should override action
          field3: { type: 'boolean', title: 'Step Field 3' }, // Should be added
        };

        mockAction.uiSchema = actionUiSchema;
        mockStep.uiSchema = stepUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual({
          field1: { type: 'string', title: 'Step Field 1' },
          field3: { type: 'boolean', title: 'Step Field 3' },
        });
      });
    });

    describe('dynamic uiSchema resolution', () => {
      test('should resolve function-based step uiSchema', async () => {
        const dynamicStepUiSchema = vi.fn().mockResolvedValue({
          dynamicField: { type: 'string', title: 'Dynamic Field' },
        });
        mockStep.uiSchema = dynamicStepUiSchema;

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(dynamicStepUiSchema).toHaveBeenCalled();
        expect(result).toEqual({
          dynamicField: { type: 'string', title: 'Dynamic Field' },
        });
      });

      test('should resolve function-based action uiSchema', async () => {
        const dynamicActionUiSchema = vi.fn().mockResolvedValue({
          actionDynamicField: { type: 'number', title: 'Action Dynamic Field' },
        });
        mockAction.uiSchema = dynamicActionUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(dynamicActionUiSchema).toHaveBeenCalled();
        expect(result).toEqual({
          actionDynamicField: { type: 'number', title: 'Action Dynamic Field' },
        });
      });

      test('should resolve both dynamic step and action uiSchemas', async () => {
        const dynamicActionUiSchema = vi.fn().mockResolvedValue({
          actionField: { type: 'string', title: 'Action Field' },
          sharedField: { type: 'string', title: 'Action Shared' },
        });
        const dynamicStepUiSchema = vi.fn().mockResolvedValue({
          stepField: { type: 'number', title: 'Step Field' },
          sharedField: { type: 'string', title: 'Step Shared' }, // Should override
        });

        mockAction.uiSchema = dynamicActionUiSchema;
        mockStep.uiSchema = dynamicStepUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(dynamicActionUiSchema).not.toHaveBeenCalled();
        expect(dynamicStepUiSchema).toHaveBeenCalled();
        expect(result).toEqual({
          stepField: { type: 'number', title: 'Step Field' },
          sharedField: { type: 'string', title: 'Step Shared' },
        });
      });

      test('should return null when dynamic uiSchemas resolve to empty objects', async () => {
        const emptyActionUiSchema = vi.fn().mockResolvedValue({});
        const emptyStepUiSchema = vi.fn().mockResolvedValue({});

        mockAction.uiSchema = emptyActionUiSchema;
        mockStep.uiSchema = emptyStepUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toBeNull();
      });

      test('should return null when dynamic uiSchemas resolve to null/undefined', async () => {
        const nullActionUiSchema = vi.fn().mockResolvedValue(null);
        const undefinedStepUiSchema = vi.fn().mockResolvedValue(undefined);

        mockAction.uiSchema = nullActionUiSchema;
        mockStep.uiSchema = undefinedStepUiSchema;
        mockStep.use = 'testAction';
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(mockAction);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toBeNull();
      });
    });

    describe('action handling', () => {
      test('should handle missing action gracefully', async () => {
        mockStep.use = 'nonExistentAction';
        mockStep.uiSchema = {
          field1: { type: 'string', title: 'Field 1' },
        };
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue(null);

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual({
          field1: { type: 'string', title: 'Field 1' },
        });
      });

      test('should handle action without uiSchema', async () => {
        mockStep.use = 'testAction';
        mockStep.uiSchema = {
          field1: { type: 'string', title: 'Field 1' },
        };
        mockModel.flowEngine.getAction = vi.fn().mockReturnValue({
          ...mockAction,
          uiSchema: undefined,
        });

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual({
          field1: { type: 'string', title: 'Field 1' },
        });
      });

      test('should handle getAction throwing error', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        mockStep.use = 'errorAction';
        mockStep.uiSchema = {
          field1: { type: 'string', title: 'Field 1' },
        };
        mockModel.flowEngine.getAction = vi.fn(() => {
          throw new Error('Action retrieval error');
        });

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to get action errorAction:', expect.any(Error));
        expect(result).toEqual({
          field1: { type: 'string', title: 'Field 1' },
        });

        consoleSpy.mockRestore();
      });

      test('should handle missing getAction method', async () => {
        // Mock a flowEngine without getAction method
        const originalGetAction = mockModel.flowEngine.getAction;
        mockModel.flowEngine.getAction = undefined;

        mockStep.use = 'testAction';
        mockStep.uiSchema = {
          field1: { type: 'string', title: 'Field 1' },
        };

        const result = await resolveStepUiSchema(mockModel, mockFlow, mockStep);

        expect(result).toEqual({
          field1: { type: 'string', title: 'Field 1' },
        });

        // Restore the original method
        mockModel.flowEngine.getAction = originalGetAction;
      });
    });
  });
});
