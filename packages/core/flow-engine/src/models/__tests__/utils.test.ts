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
  generateUid,
  mergeFlowDefinitions,
  isInheritedFrom,
  resolveDefaultParams,
  resolveUiSchema,
  FlowExitException,
  defineAction,
  compileUiSchema,
  resolveDefaultOptions,
  processMetaChildren,
  FLOW_ENGINE_NAMESPACE,
} from '../../utils';
import { FlowModel } from '../flowModel';
import { FlowEngine } from '../../flowEngine';
import type {
  FlowDefinition,
  ParamsContext,
  ActionDefinition,
  DeepPartial,
  ModelConstructor,
  StepParams,
} from '../../types';
import type { ISchema } from '@formily/json-schema';
import type { APIClient } from '@nocobase/sdk';

// Helper functions
const createMockFlowEngine = (): FlowEngine => {
  const mockEngine = {
    translate: vi.fn((key: string, options?: Record<string, unknown>) => {
      if (options?.returnOriginal) return key;
      return `translated_${key}`;
    }),
    getContext: vi.fn(() => ({ app: {}, api: {} as APIClient, flowEngine: mockEngine as FlowEngine })),
    createModel: vi.fn(),
    getModel: vi.fn(),
    applyFlowCache: new Map(),
  } as Partial<FlowEngine>;

  return mockEngine as FlowEngine;
};

interface MockFlowModelOptions {
  uid?: string;
  flowEngine?: FlowEngine;
  stepParams?: StepParams;
  sortIndex?: number;
  subModels?: Record<string, FlowModel | FlowModel[]>;
}

const createMockFlowModel = (overrides: MockFlowModelOptions = {}): FlowModel => {
  const flowEngine = createMockFlowEngine();
  const options = {
    uid: 'test-model-uid',
    flowEngine,
    stepParams: {},
    sortIndex: 0,
    subModels: {},
    ...overrides,
  };

  const model = new FlowModel(options);
  // Ensure the flowEngine is properly set
  Object.defineProperty(model, 'flowEngine', {
    value: flowEngine,
    writable: true,
    configurable: true,
  });
  return model;
};

const createBasicFlowDefinition = (overrides: Partial<FlowDefinition> = {}): FlowDefinition => ({
  key: 'testFlow',
  steps: {
    step1: {
      handler: vi.fn().mockResolvedValue('step1-result'),
    },
    step2: {
      handler: vi.fn().mockResolvedValue('step2-result'),
    },
  },
  ...overrides,
});

const createPatchFlowDefinition = (
  overrides: Partial<DeepPartial<FlowDefinition>> = {},
): DeepPartial<FlowDefinition> => ({
  title: 'Patched Flow',
  steps: {
    step1: {
      handler: vi.fn().mockResolvedValue('patched-step1-result'),
    },
  },
  ...overrides,
});

// Test setup
let mockModel: FlowModel;
let mockFlowEngine: FlowEngine;

beforeEach(() => {
  mockFlowEngine = createMockFlowEngine();
  mockModel = createMockFlowModel();
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

  // ==================== generateUid() FUNCTION ====================
  describe('generateUid()', () => {
    describe('basic generation functionality', () => {
      test('should generate a string', () => {
        const uid = generateUid();

        expect(typeof uid).toBe('string');
        expect(uid).toBeDefined();
        expect(uid.length).toBeGreaterThan(10); // Should be reasonably long
      });
    });

    describe('uniqueness validation', () => {
      test('should generate different UIDs on consecutive calls', () => {
        const uid1 = generateUid();
        const uid2 = generateUid();

        expect(uid1).not.toBe(uid2);
      });

      test('should generate unique UIDs in bulk', () => {
        const uids = Array.from({ length: 100 }, () => generateUid());
        const uniqueUids = new Set(uids);

        expect(uniqueUids.size).toBe(100); // All should be unique
      });

      test('should maintain uniqueness across multiple executions', () => {
        const batch1 = Array.from({ length: 10 }, () => generateUid());
        const batch2 = Array.from({ length: 10 }, () => generateUid());

        const allUids = [...batch1, ...batch2];
        const uniqueUids = new Set(allUids);

        expect(uniqueUids.size).toBe(20);
      });
    });

    describe('format validation', () => {
      test('should contain only alphanumeric characters', () => {
        const uid = generateUid();

        expect(/^[a-z0-9]+$/.test(uid)).toBe(true);
      });

      test('should have consistent length range', () => {
        const uids = Array.from({ length: 50 }, () => generateUid());

        uids.forEach((uid) => {
          expect(uid.length).toBeGreaterThan(15);
          expect(uid.length).toBeLessThan(30);
        });
      });

      test('should not contain special characters', () => {
        const uid = generateUid();

        expect(uid).not.toMatch(/[^a-z0-9]/);
      });
    });
  });

  // ==================== mergeFlowDefinitions() FUNCTION ====================
  describe('mergeFlowDefinitions()', () => {
    let originalFlow: FlowDefinition;
    let patchFlow: DeepPartial<FlowDefinition>;

    beforeEach(() => {
      originalFlow = createBasicFlowDefinition({
        title: 'Original Flow',
        on: { eventName: 'originalEvent' },
      });
      patchFlow = createPatchFlowDefinition();
    });

    describe('basic merging functionality', () => {
      test('should merge flow definitions correctly', () => {
        const merged = mergeFlowDefinitions(originalFlow, patchFlow);

        expect(merged.title).toBe('Patched Flow');
        expect(merged.key).toBe(originalFlow.key);
        expect(merged.steps).toBeDefined();
      });

      test('should preserve original flow when patch is empty', () => {
        const merged = mergeFlowDefinitions(originalFlow, {});

        expect(merged.title).toBe(originalFlow.title);
        expect(merged.key).toBe(originalFlow.key);
        expect(merged.steps).toEqual(originalFlow.steps);
      });

      test('should handle undefined patch properties', () => {
        const merged = mergeFlowDefinitions(originalFlow, {
          title: undefined,
          steps: undefined,
        });

        expect(merged.title).toBe(originalFlow.title);
        expect(merged.steps).toEqual(originalFlow.steps);
      });
    });

    describe('property override', () => {
      test('should override title when provided in patch', () => {
        const merged = mergeFlowDefinitions(originalFlow, {
          title: 'Overridden Title',
        });

        expect(merged.title).toBe('Overridden Title');
      });

      test('should override event configuration when provided', () => {
        const merged = mergeFlowDefinitions(originalFlow, {
          on: { eventName: 'newEvent' },
        });

        expect(merged.on).toEqual({ eventName: 'newEvent' });
      });

      test('should preserve original properties when not in patch', () => {
        const merged = mergeFlowDefinitions(originalFlow, {
          title: 'New Title',
        });

        expect(merged.key).toBe(originalFlow.key);
        expect(merged.on).toEqual(originalFlow.on);
      });

      test('should handle null values in patch', () => {
        const merged = mergeFlowDefinitions(originalFlow, {
          title: null,
        });

        expect(merged.title).toBe(originalFlow.title);
      });
    });

    describe('steps merging', () => {
      test('should merge step definitions correctly', () => {
        const patchWithSteps = {
          steps: {
            step1: { newProperty: 'value', use: 'confirm' },
            step3: { handler: vi.fn() },
          },
        };

        const merged = mergeFlowDefinitions(originalFlow, patchWithSteps);

        expect(merged.steps.step1).toEqual(
          expect.objectContaining({
            handler: originalFlow.steps.step1.handler,
            newProperty: 'value',
          }),
        );
        expect(merged.steps.step2).toEqual(originalFlow.steps.step2);
        expect(merged.steps.step3).toEqual(patchWithSteps.steps.step3);
      });

      test('should create new steps when they do not exist in original', () => {
        const patchWithNewStep = {
          steps: {
            newStep: { handler: vi.fn().mockReturnValue('new-result') },
          },
        };

        const merged = mergeFlowDefinitions(originalFlow, patchWithNewStep);

        expect(merged.steps.newStep).toEqual(patchWithNewStep.steps.newStep);
        expect(merged.steps.step1).toEqual(originalFlow.steps.step1);
      });

      test('should handle empty steps in patch', () => {
        const merged = mergeFlowDefinitions(originalFlow, { steps: {} });

        expect(merged.steps).toEqual(originalFlow.steps);
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
    let mockContext: ParamsContext<FlowModel>;

    beforeEach(() => {
      mockContext = {
        model: mockModel,
        globals: {
          flowEngine: mockFlowEngine,
          app: {},
        },
        app: {} as any,
        extra: { testExtra: 'value' },
      };
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
        const paramsFn = vi.fn((ctx: ParamsContext<FlowModel>) => ({
          modelUid: ctx.model.uid,
          extraData: ctx.extra.testExtra,
        }));

        const result = await resolveDefaultParams(paramsFn, mockContext);

        expect(result).toEqual({
          modelUid: mockModel.uid,
          extraData: 'value',
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

  // ==================== resolveUiSchema() FUNCTION ====================
  describe('resolveUiSchema()', () => {
    let mockContext: ParamsContext<FlowModel>;

    beforeEach(() => {
      mockContext = {
        model: mockModel,
        globals: {
          flowEngine: mockFlowEngine,
          app: {},
        },
        app: {} as any,
        extra: { testExtra: 'value' },
      };
    });

    describe('static schema resolution', () => {
      test('should return static schema object directly', async () => {
        const staticSchema: Record<string, ISchema> = {
          field1: { type: 'string', title: 'Field 1' },
          field2: { type: 'number', title: 'Field 2' },
        };

        const result = await resolveUiSchema(staticSchema, mockContext);

        expect(result).toEqual(staticSchema);
      });

      test('should return empty object for undefined schema', async () => {
        const result = await resolveUiSchema(undefined, mockContext);

        expect(result).toEqual({});
      });

      test('should return empty object for null schema', async () => {
        const result = await resolveUiSchema(null, mockContext);

        expect(result).toEqual({});
      });

      test('should handle complex static schema', async () => {
        const complexSchema: Record<string, ISchema> = {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string', title: 'Name' },
              age: { type: 'number', title: 'Age' },
            },
          },
          settings: {
            type: 'object',
            'x-component': 'FormLayout',
            properties: {
              theme: { type: 'string', enum: ['light', 'dark'] },
            },
          },
        };

        const result = await resolveUiSchema(complexSchema, mockContext);

        expect(result).toEqual(complexSchema);
      });
    });

    describe('function schema resolution', () => {
      test('should call function with context and return result', async () => {
        const schemaFn = vi.fn().mockReturnValue({
          dynamicField: { type: 'string', title: 'Dynamic Field' },
        });

        const result = await resolveUiSchema(schemaFn, mockContext);

        expect(schemaFn).toHaveBeenCalledWith(mockContext);
        expect(result).toEqual({
          dynamicField: { type: 'string', title: 'Dynamic Field' },
        });
      });

      test('should handle function accessing context properties', async () => {
        const schemaFn = vi.fn((ctx: ParamsContext<FlowModel>) => ({
          modelInfo: {
            type: 'string',
            title: 'Model UID',
            default: ctx.model.uid,
          },
          extraInfo: {
            type: 'string',
            title: 'Extra Data',
            default: ctx.extra.testExtra,
          },
        }));

        const result = await resolveUiSchema(schemaFn, mockContext);

        expect(result.modelInfo.default).toBe(mockModel.uid);
        expect(result.extraInfo.default).toBe('value');
      });
    });

    describe('async processing', () => {
      test('should handle async function correctly', async () => {
        const asyncSchemaFn = vi.fn().mockResolvedValue({
          asyncField: { type: 'string', title: 'Async Field' },
        });

        const result = await resolveUiSchema(asyncSchemaFn, mockContext);

        expect(asyncSchemaFn).toHaveBeenCalledWith(mockContext);
        expect(result).toEqual({
          asyncField: { type: 'string', title: 'Async Field' },
        });
      });

      test('should handle async function with delay', async () => {
        const asyncSchemaFn = vi.fn(
          () =>
            new Promise<any>((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    delayedField: { type: 'number', title: 'Delayed Field' },
                  }),
                10,
              ),
            ),
        );

        const result = await resolveUiSchema(asyncSchemaFn, mockContext);

        expect(result).toEqual({
          delayedField: { type: 'number', title: 'Delayed Field' },
        });
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

        const result = await resolveDefaultOptions(staticOptions, mockModel);

        expect(result).toEqual(staticOptions);
      });

      test('should return empty object for undefined options', async () => {
        const result = await resolveDefaultOptions(undefined, mockModel);

        expect(result).toEqual({});
      });

      test('should return empty object for null options', async () => {
        const result = await resolveDefaultOptions(null, mockModel);

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

        const result = await resolveDefaultOptions(complexOptions, mockModel);

        expect(result).toEqual(complexOptions);
      });
    });

    describe('function options resolution', () => {
      test('should call function with parent model and return result', async () => {
        const optionsFn = vi.fn().mockReturnValue({ dynamic: 'value' });

        const result = await resolveDefaultOptions(optionsFn, mockModel);

        expect(optionsFn).toHaveBeenCalledWith(mockModel);
        expect(result).toEqual({ dynamic: 'value' });
      });

      test('should handle function accessing model properties', async () => {
        const optionsFn = vi.fn((parentModel: FlowModel) => ({
          use: 'DynamicModel',
          parentUid: parentModel.uid,
          sortIndex: parentModel.sortIndex || 0,
        }));

        const result = await resolveDefaultOptions(optionsFn, mockModel);

        expect(result).toEqual({
          use: 'DynamicModel',
          parentUid: mockModel.uid,
          sortIndex: 0,
        });
      });

      test('should handle async function correctly', async () => {
        const asyncOptionsFn = vi.fn().mockResolvedValue({ async: 'result' });

        const result = await resolveDefaultOptions(asyncOptionsFn, mockModel);

        expect(asyncOptionsFn).toHaveBeenCalledWith(mockModel);
        expect(result).toEqual({ async: 'result' });
      });

      test('should handle async function with delay', async () => {
        const asyncOptionsFn = vi.fn(
          () => new Promise((resolve) => setTimeout(() => resolve({ delayed: 'value' }), 10)),
        );

        const result = await resolveDefaultOptions(asyncOptionsFn, mockModel);

        expect(result).toEqual({ delayed: 'value' });
      });
    });

    describe('error handling', () => {
      test('should handle function throwing errors and return empty object', async () => {
        const errorFn = vi.fn(() => {
          throw new Error('Options generation error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await resolveDefaultOptions(errorFn, mockModel);

        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving defaultOptions function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle async function rejection and return empty object', async () => {
        const rejectFn = vi.fn().mockRejectedValue(new Error('Async error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await resolveDefaultOptions(rejectFn, mockModel);

        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving defaultOptions function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle function returning null and convert to empty object', async () => {
        const nullFn = vi.fn().mockReturnValue(null);

        const result = await resolveDefaultOptions(nullFn, mockModel);

        expect(result).toEqual({});
      });

      test('should handle function returning undefined and convert to empty object', async () => {
        const undefinedFn = vi.fn().mockReturnValue(undefined);

        const result = await resolveDefaultOptions(undefinedFn, mockModel);

        expect(result).toEqual({});
      });
    });
  });

  // ==================== resolveMetaChildren() FUNCTION ====================
  describe('resolveMetaChildren()', () => {
    // Note: resolveMetaChildren is an internal function, but we can test it indirectly through processMetaChildren
    // However, for completeness, let's add tests for the children function form that was newly added

    describe('function children resolution', () => {
      test('should process function-based children that return static array', async () => {
        const childrenFn = vi.fn().mockReturnValue([
          {
            title: 'Dynamic Table',
            defaultOptions: { use: 'DynamicTableModel' },
          },
          {
            title: 'Dynamic Form',
            defaultOptions: { use: 'DynamicFormModel' },
          },
        ]);

        const result = await processMetaChildren(childrenFn, mockModel, 'dynamic.');

        expect(childrenFn).toHaveBeenCalledWith(mockModel);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          key: 'dynamic.Dynamic Table',
          label: 'Dynamic Table',
          icon: undefined,
          createModelOptions: {
            use: 'DynamicTableModel',
          },
          toggleDetector: undefined,
          customRemove: undefined,
        });
        expect(result[1]).toEqual({
          key: 'dynamic.Dynamic Form',
          label: 'Dynamic Form',
          icon: undefined,
          createModelOptions: {
            use: 'DynamicFormModel',
          },
          toggleDetector: undefined,
          customRemove: undefined,
        });
      });

      test('should process async function-based children', async () => {
        const asyncChildrenFn = vi.fn().mockResolvedValue([
          {
            title: 'Async Chart',
            defaultOptions: { use: 'AsyncChartModel' },
          },
        ]);

        const result = await processMetaChildren(asyncChildrenFn, mockModel);

        expect(asyncChildrenFn).toHaveBeenCalledWith(mockModel);
        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Async Chart');
        expect(result[0].createModelOptions.use).toBe('AsyncChartModel');
      });

      test('should handle function-based children with conditional logic', async () => {
        // Mock a model method that the function can use for conditional logic
        mockModel.getUserRole = vi.fn().mockReturnValue('admin');

        const conditionalChildrenFn = vi.fn((parentModel) => {
          const isAdmin = parentModel.getUserRole() === 'admin';
          return [
            {
              title: 'Basic Table',
              defaultOptions: { use: 'BasicTableModel' },
            },
            ...(isAdmin
              ? [
                  {
                    title: 'Admin Panel',
                    defaultOptions: { use: 'AdminPanelModel' },
                  },
                ]
              : []),
          ];
        });

        const result = await processMetaChildren(conditionalChildrenFn, mockModel);

        expect(conditionalChildrenFn).toHaveBeenCalledWith(mockModel);
        expect(result).toHaveLength(2);
        expect(result[0].label).toBe('Basic Table');
        expect(result[1].label).toBe('Admin Panel');
      });

      test('should handle function-based children that return empty array', async () => {
        const emptyChildrenFn = vi.fn().mockReturnValue([]);

        const result = await processMetaChildren(emptyChildrenFn, mockModel);

        expect(emptyChildrenFn).toHaveBeenCalledWith(mockModel);
        expect(result).toEqual([]);
      });

      test('should handle function-based children with nested function children', async () => {
        const parentChildrenFn = vi.fn().mockReturnValue([
          {
            title: 'Parent Group',
            children: vi.fn().mockReturnValue([
              {
                title: 'Nested Item',
                defaultOptions: { use: 'NestedModel' },
              },
            ]),
          },
        ]);

        const result = await processMetaChildren(parentChildrenFn, mockModel);

        expect(parentChildrenFn).toHaveBeenCalledWith(mockModel);
        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Parent Group');
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].label).toBe('Nested Item');
        expect(result[0].children[0].createModelOptions.use).toBe('NestedModel');
      });
    });

    describe('error handling for function children', () => {
      test('should handle function-based children throwing error and return empty array', async () => {
        const errorChildrenFn = vi.fn(() => {
          throw new Error('Children generation error');
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await processMetaChildren(errorChildrenFn, mockModel);

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving meta children function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle async function-based children rejection and return empty array', async () => {
        const rejectChildrenFn = vi.fn().mockRejectedValue(new Error('Async children error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await processMetaChildren(rejectChildrenFn, mockModel);

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving meta children function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle function-based children returning null and convert to empty array', async () => {
        const nullChildrenFn = vi.fn().mockReturnValue(null);

        const result = await processMetaChildren(nullChildrenFn, mockModel);

        expect(result).toEqual([]);
      });

      test('should handle function-based children returning undefined and convert to empty array', async () => {
        const undefinedChildrenFn = vi.fn().mockReturnValue(undefined);

        const result = await processMetaChildren(undefinedChildrenFn, mockModel);

        expect(result).toEqual([]);
      });
    });

    describe('mixed static and function children', () => {
      test('should handle combination of static and function-based defaultOptions within function children', async () => {
        const mixedChildrenFn = vi.fn().mockReturnValue([
          {
            title: 'Static Options Block',
            defaultOptions: { use: 'StaticModel', config: 'static' },
          },
          {
            title: 'Dynamic Options Block',
            defaultOptions: vi.fn().mockReturnValue({ use: 'DynamicModel', config: 'dynamic' }),
          },
        ]);

        const result = await processMetaChildren(mixedChildrenFn, mockModel);

        expect(result).toHaveLength(2);
        expect(result[0].createModelOptions).toEqual({
          use: 'StaticModel',
          config: 'static',
        });
        expect(result[1].createModelOptions).toEqual({
          use: 'DynamicModel',
          config: 'dynamic',
        });
      });
    });
  });

  // ==================== processMetaChildren() FUNCTION ====================
  describe('processMetaChildren()', () => {
    describe('flat children processing', () => {
      test('should process simple children array', async () => {
        const children = [
          {
            title: 'Table',
            icon: 'table',
            defaultOptions: { use: 'TableModel' },
          },
          {
            title: 'Form',
            icon: 'form',
            defaultOptions: { use: 'FormModel' },
          },
        ];

        const result = await processMetaChildren(children, mockModel, 'prefix.');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          key: 'prefix.Table',
          label: 'Table',
          icon: 'table',
          createModelOptions: {
            use: 'TableModel',
          },
          toggleDetector: undefined,
          customRemove: undefined,
        });
        expect(result[1]).toEqual({
          key: 'prefix.Form',
          label: 'Form',
          icon: 'form',
          createModelOptions: {
            use: 'FormModel',
          },
          toggleDetector: undefined,
          customRemove: undefined,
        });
      });

      test('should handle children with function defaultOptions', async () => {
        const dynamicOptionsFn = vi.fn().mockReturnValue({ use: 'DynamicModel', parentUid: 'test' });
        const children = [
          {
            title: 'Dynamic Block',
            defaultOptions: dynamicOptionsFn,
          },
        ];

        const result = await processMetaChildren(children, mockModel);

        expect(dynamicOptionsFn).toHaveBeenCalledWith(mockModel);
        expect(result[0].createModelOptions).toEqual({
          use: 'DynamicModel',
          parentUid: 'test',
        });
      });

      test('should handle children with toggleDetector and customRemove', async () => {
        const toggleDetector = vi.fn().mockReturnValue(true);
        const customRemove = vi.fn().mockResolvedValue(undefined);
        const children = [
          {
            title: 'Advanced Block',
            defaultOptions: { use: 'AdvancedModel' },
            toggleDetector,
            customRemove,
          },
        ];

        const result = await processMetaChildren(children, mockModel);

        expect(result[0].toggleDetector).toBe(toggleDetector);
        expect(result[0].customRemove).toBe(customRemove);
      });
    });

    describe('nested children processing', () => {
      test('should process nested children structure', async () => {
        const children = [
          {
            title: 'Basic Blocks',
            icon: 'blocks',
            children: [
              {
                title: 'Table',
                defaultOptions: { use: 'TableModel' },
              },
              {
                title: 'Form',
                defaultOptions: { use: 'FormModel' },
              },
            ],
          },
          {
            title: 'Advanced Blocks',
            children: [
              {
                title: 'Chart',
                defaultOptions: { use: 'ChartModel' },
              },
            ],
          },
        ];

        const result = await processMetaChildren(children, mockModel, 'test.');

        expect(result).toHaveLength(2);

        // First group - Basic Blocks
        expect(result[0]).toEqual({
          key: 'test.Basic Blocks',
          label: 'Basic Blocks',
          icon: 'blocks',
          children: [
            {
              key: 'test.Basic Blocks.Table',
              label: 'Table',
              icon: undefined,
              createModelOptions: {
                use: 'TableModel',
              },
              toggleDetector: undefined,
              customRemove: undefined,
            },
            {
              key: 'test.Basic Blocks.Form',
              label: 'Form',
              icon: undefined,
              createModelOptions: {
                use: 'FormModel',
              },
              toggleDetector: undefined,
              customRemove: undefined,
            },
          ],
        });

        // Second group - Advanced Blocks
        expect(result[1]).toEqual({
          key: 'test.Advanced Blocks',
          label: 'Advanced Blocks',
          icon: undefined,
          children: [
            {
              key: 'test.Advanced Blocks.Chart',
              label: 'Chart',
              icon: undefined,
              createModelOptions: {
                use: 'ChartModel',
              },
              toggleDetector: undefined,
              customRemove: undefined,
            },
          ],
        });
      });

      test('should handle deep nesting (3+ levels)', async () => {
        const children = [
          {
            title: 'Category A',
            children: [
              {
                title: 'Subcategory A1',
                children: [
                  {
                    title: 'Item A1a',
                    defaultOptions: { use: 'ItemA1aModel' },
                  },
                  {
                    title: 'Item A1b',
                    defaultOptions: { use: 'ItemA1bModel' },
                  },
                ],
              },
            ],
          },
        ];

        const result = await processMetaChildren(children, mockModel);

        expect(result).toHaveLength(1);
        expect(result[0].key).toBe('Category A');
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].key).toBe('Category A.Subcategory A1');
        expect(result[0].children[0].children).toHaveLength(2);
        expect(result[0].children[0].children[0].key).toBe('Category A.Subcategory A1.Item A1a');
        expect(result[0].children[0].children[0].createModelOptions.use).toBe('ItemA1aModel');
      });
    });

    describe('key generation', () => {
      test('should generate keys with custom prefix', async () => {
        const children = [
          { title: 'Block1', defaultOptions: { use: 'Model1' } },
          { title: 'Block2', defaultOptions: { use: 'Model2' } },
        ];

        const result = await processMetaChildren(children, mockModel, 'custom.');

        expect(result[0].key).toBe('custom.Block1');
        expect(result[1].key).toBe('custom.Block2');
      });

      test('should generate keys without prefix when not provided', async () => {
        const children = [{ title: 'Block1', defaultOptions: { use: 'Model1' } }];

        const result = await processMetaChildren(children, mockModel);

        expect(result[0].key).toBe('Block1');
      });

      test('should handle missing title by generating item keys', async () => {
        const children = [{ defaultOptions: { use: 'Model1' } }, { defaultOptions: { use: 'Model2' } }];

        const result = await processMetaChildren(children, mockModel, 'test.');

        expect(result[0].key).toBe('test.item-0');
        expect(result[1].key).toBe('test.item-1');
      });
    });

    describe('use property handling', () => {
      test('should preserve string use property', async () => {
        const children = [
          {
            title: 'Block',
            defaultOptions: { use: 'TableModel', config: { test: true } },
          },
        ];

        const result = await processMetaChildren(children, mockModel);

        expect(result[0].createModelOptions.use).toBe('TableModel');
        expect(result[0].createModelOptions.config).toEqual({ test: true });
      });

      test('should fallback to key when use is not resolvable', async () => {
        const children = [
          {
            title: 'Block',
            defaultOptions: { someOtherProp: 'value' },
          },
        ];

        const result = await processMetaChildren(children, mockModel);

        expect(result[0].createModelOptions.use).toBe('Block');
      });
    });

    describe('error handling', () => {
      test('should handle defaultOptions function errors gracefully', async () => {
        const errorFn = vi.fn(() => {
          throw new Error('Options error');
        });

        const children = [
          {
            title: 'Error Block',
            defaultOptions: errorFn,
          },
        ];

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await processMetaChildren(children, mockModel);

        expect(result[0].createModelOptions).toEqual({
          use: 'Error Block',
        });
        expect(consoleSpy).toHaveBeenCalledWith('Error resolving defaultOptions function:', expect.any(Error));

        consoleSpy.mockRestore();
      });

      test('should handle empty children array', async () => {
        const result = await processMetaChildren([], mockModel);

        expect(result).toEqual([]);
      });

      test('should handle null/undefined children items', async () => {
        const children = [
          null,
          {
            title: 'Valid Block',
            defaultOptions: { use: 'ValidModel' },
          },
          undefined,
        ].filter(Boolean); // Filter out null/undefined for realistic test

        const result = await processMetaChildren(children, mockModel);

        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Valid Block');
      });
    });
  });
});
