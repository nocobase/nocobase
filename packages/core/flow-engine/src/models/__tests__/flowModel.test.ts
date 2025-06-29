/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { FlowModel, defineFlow } from '../flowModel';
import { FlowEngine } from '../../flowEngine';
import { ForkFlowModel } from '../forkFlowModel';
import type { FlowDefinition, FlowContext, FlowModelOptions, DefaultStructure } from '../../types';
import { APIClient } from '@nocobase/sdk';

// Mock dependencies
vi.mock('@formily/reactive', async () => {
  const actual = await vi.importActual('@formily/reactive');
  return {
    ...actual,
    action: (fn: any) => fn,
    autorun: vi.fn(),
    define: vi.fn(),
    observable: (obj: any) => obj,
    observe: vi.fn(() => vi.fn()),
  };
});

vi.mock('uid/secure', () => ({
  uid: vi.fn(() => 'mock-uid-' + Math.random().toString(36).substring(2, 11)),
}));

vi.mock('../forkFlowModel', () => ({
  ForkFlowModel: vi.fn().mockImplementation(function (master: any, localProps: any, forkId: number) {
    const instance = {
      master,
      localProps,
      forkId,
      setProps: vi.fn(),
      dispose: vi.fn(),
      disposed: false,
    };
    Object.setPrototypeOf(instance, ForkFlowModel.prototype);
    return instance;
  }),
}));

vi.mock('../../components/settings/wrappers/contextual/StepSettingsDialog', () => ({
  openStepSettingsDialog: vi.fn(),
}));

vi.mock('../../components/settings/wrappers/contextual/StepRequiredSettingsDialog', () => ({
  openRequiredParamsStepFormDialog: vi.fn(),
}));

vi.mock('lodash', async () => {
  const actual = await vi.importActual('lodash');
  return {
    ...actual,
    debounce: vi.fn((fn) => fn),
  };
});

// Helper functions
const createMockFlowEngine = (): FlowEngine => {
  const applyFlowCache = new Map();
  const mockEngine = {
    getModel: vi.fn(),
    createModel: vi.fn(),
    moveModel: vi.fn().mockReturnValue(true),
    removeModel: vi.fn().mockReturnValue(true),
    saveModel: vi.fn().mockResolvedValue({ success: true }),
    destroyModel: vi.fn().mockResolvedValue({ success: true }),
    getAction: vi.fn(),
    getContext: vi.fn(() => ({ app: {}, api: {} as APIClient, flowEngine: mockEngine as FlowEngine })),
    translate: vi.fn((key: string) => key),
    reactView: null as any,
    applyFlowCache,
  } as Partial<FlowEngine>;

  // Mock the cache delete method to track delete calls while preserving original behavior
  (mockEngine.applyFlowCache as any).delete = vi.fn(mockEngine.applyFlowCache.delete.bind(mockEngine.applyFlowCache));
  // Add the instance method to constructor as static method for testing access
  (mockEngine.constructor as any).generateApplyFlowCacheKey = vi.fn(
    (prefix: string, type: string, modelUid: string) => `${prefix}-${type}-${modelUid}`,
  );

  return mockEngine as FlowEngine;
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

const createAutoFlowDefinition = (overrides: Partial<FlowDefinition> = {}): FlowDefinition => ({
  key: 'autoFlow',
  auto: true,
  sort: 1,
  steps: {
    autoStep: {
      handler: vi.fn().mockResolvedValue('auto-result'),
    },
  },
  ...overrides,
});

const createEventFlowDefinition = (eventName: string, overrides: Partial<FlowDefinition> = {}): FlowDefinition => ({
  key: `${eventName}Flow`,
  on: { eventName },
  steps: {
    eventStep: {
      handler: vi.fn().mockResolvedValue('event-result'),
    },
  },
  ...overrides,
});

const createErrorFlowDefinition = (
  errorMessage = 'Test error',
  overrides: Partial<FlowDefinition> = {},
): FlowDefinition => ({
  key: 'errorFlow',
  steps: {
    errorStep: {
      handler: vi.fn().mockRejectedValue(new Error(errorMessage)),
    },
  },
  ...overrides,
});

// Test setup
let flowEngine: FlowEngine;
let modelOptions: FlowModelOptions;

beforeEach(() => {
  flowEngine = createMockFlowEngine();
  modelOptions = {
    uid: 'test-model-uid',
    flowEngine,
    props: { testProp: 'value' },
    stepParams: { testFlow: { step1: { param1: 'value1' } } },
    sortIndex: 0,
    subModels: {},
  };
  vi.clearAllMocks();
});

describe('FlowModel', () => {
  // ==================== CONSTRUCTOR & INITIALIZATION ====================
  describe('Constructor & Initialization', () => {
    test('should create instance with basic options', () => {
      const model = new FlowModel(modelOptions);

      expect(model.uid).toBe(modelOptions.uid);
      expect(model.props).toEqual(expect.objectContaining(modelOptions.props));
      expect(model.stepParams).toEqual(expect.objectContaining(modelOptions.stepParams));
      expect(model.flowEngine).toBe(modelOptions.flowEngine);
      expect(model.sortIndex).toBe(modelOptions.sortIndex);
    });

    test('should generate uid if not provided', () => {
      const options = { ...modelOptions, uid: undefined };
      const model = new FlowModel(options);

      expect(model.uid).toBeDefined();
      expect(typeof model.uid).toBe('string');
      expect(model.uid.length).toBeGreaterThan(0);
    });

    test('should return existing instance if already exists in FlowEngine', () => {
      const firstInstance = new FlowModel(modelOptions);
      flowEngine.getModel = vi.fn().mockReturnValue(firstInstance);

      const secondInstance = new FlowModel(modelOptions);

      expect(secondInstance).toBe(firstInstance);
      expect(flowEngine.getModel).toHaveBeenCalledWith(modelOptions.uid);
    });

    test('should initialize with default values when options are minimal', () => {
      const model = new FlowModel({ flowEngine } as FlowModelOptions);

      expect(model.props).toBeDefined();
      expect(model.stepParams).toBeDefined();
      expect(model.subModels).toBeDefined();
      expect(model.forks).toBeInstanceOf(Set);
      expect(model.forks.size).toBe(0);
    });

    test('should handle missing flowEngine gracefully', () => {
      expect(() => {
        new FlowModel({} as any);
      }).not.toThrow();

      const model = new FlowModel({} as any);
      expect(model.flowEngine).toBeUndefined();
    });

    test('should initialize emitter', () => {
      const model = new FlowModel(modelOptions);

      expect(model.emitter).toBeDefined();
      expect(typeof model.emitter.on).toBe('function');
      expect(typeof model.emitter.emit).toBe('function');
    });
  });

  // ==================== PROPERTIES MANAGEMENT ====================
  describe('Properties Management', () => {
    let model: FlowModel;

    beforeEach(() => {
      model = new FlowModel(modelOptions);
    });

    describe('setProps', () => {
      test('should merge props correctly', () => {
        const initialProps = { a: 1, b: 2 };
        model.setProps(initialProps);

        expect(model.props).toEqual(expect.objectContaining(initialProps));

        const additionalProps = { b: 3, c: 4 };
        model.setProps(additionalProps);

        expect(model.props).toEqual(expect.objectContaining({ a: 1, b: 3, c: 4 }));
      });

      test('should handle null and undefined props', () => {
        const originalProps = { ...model.props };

        model.setProps(null as any);
        expect(model.props).toEqual(originalProps);

        model.setProps({ test: 'value' });
        model.setProps(undefined as any);
        expect(model.props).toEqual(expect.objectContaining({ test: 'value' }));
      });

      test('should handle nested objects', () => {
        const nestedProps = {
          user: { name: 'John', age: 30 },
          settings: { theme: 'dark', lang: 'en' },
        };

        model.setProps(nestedProps);
        expect(model.props).toEqual(expect.objectContaining(nestedProps));

        model.setProps({ user: { name: 'Jane', email: 'jane@example.com' } });
        expect(model.props.user).toEqual({ name: 'Jane', email: 'jane@example.com' });
        expect(model.props.settings).toEqual({ theme: 'dark', lang: 'en' });
      });
    });

    describe('setStepParams', () => {
      test('should merge step parameters correctly', () => {
        const initialParams = {
          flow1: { step1: { param1: 'value1' } },
          flow2: { step2: { param2: 'value2' } },
        };

        model.setStepParams(initialParams);
        expect(model.stepParams).toEqual(expect.objectContaining(initialParams));

        const additionalParams = {
          flow1: { step1: { param1: 'updated', param3: 'value3' } },
          flow3: { step3: { param4: 'value4' } },
        };

        model.setStepParams(additionalParams);

        expect(model.stepParams).toEqual(
          expect.objectContaining({
            flow1: { step1: { param1: 'updated', param3: 'value3' } },
            flow2: { step2: { param2: 'value2' } },
            flow3: { step3: { param4: 'value4' } },
          }),
        );
      });

      test('should handle empty and null parameters', () => {
        const originalParams = { ...model.stepParams };

        model.setStepParams({});
        expect(model.stepParams).toEqual(originalParams);

        model.setStepParams(null as any);
        expect(model.stepParams).toEqual(originalParams);
      });
    });
  });

  // ==================== FLOW MANAGEMENT ====================
  describe('Flow Management', () => {
    let TestFlowModel: typeof FlowModel;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel<any> {
        static name = `TestModel_${Math.random().toString(36).substring(2, 11)}`;
      };
    });

    describe('registerFlow', () => {
      test('should register flow with definition object', () => {
        const flow = createBasicFlowDefinition();

        TestFlowModel.registerFlow(flow);

        const registeredFlows = TestFlowModel.getFlows();
        expect(registeredFlows.has(flow.key)).toBe(true);
        expect(registeredFlows.get(flow.key)).toEqual(flow);
      });

      test('should register flow with defineFlow helper', () => {
        const flowDef = defineFlow({
          key: 'helperFlow',
          steps: {
            step1: { handler: vi.fn() },
          },
        });

        TestFlowModel.registerFlow(flowDef);

        const registeredFlows = TestFlowModel.getFlows();
        expect(registeredFlows.has('helperFlow')).toBe(true);
      });

      test('should handle complex flow definitions', () => {
        const complexFlow = {
          key: 'complexFlow',
          auto: true,
          sort: 5,
          on: { eventName: 'complexEvent' },
          steps: {
            actionStep: {
              use: 'testAction',
              defaultParams: { actionParam: 'value' },
            },
            handlerStep: {
              handler: vi.fn().mockResolvedValue('handler-result'),
              defaultParams: { handlerParam: 'value' },
            },
          },
        };

        expect(() => {
          TestFlowModel.registerFlow(complexFlow);
        }).not.toThrow();

        const registered = TestFlowModel.getFlows().get(complexFlow.key);
        expect(registered).toEqual(complexFlow);
      });
    });

    describe('getFlows', () => {
      test('should return empty map for new class', () => {
        const flows = TestFlowModel.getFlows();
        expect(flows).toBeInstanceOf(Map);
        expect(flows.size).toBe(0);
      });

      test('should return all registered flows', () => {
        const flow1 = createBasicFlowDefinition();
        const flow2 = createAutoFlowDefinition();

        TestFlowModel.registerFlow(flow1);
        TestFlowModel.registerFlow(flow2);

        const flows = TestFlowModel.getFlows();
        expect(flows.size).toBe(2);
        expect(flows.has(flow1.key)).toBe(true);
        expect(flows.has(flow2.key)).toBe(true);
      });
    });

    describe('inheritance', () => {
      test('should inherit flows from parent class', () => {
        const ParentModel = class extends FlowModel {};
        const parentFlow = createBasicFlowDefinition();
        ParentModel.registerFlow(parentFlow);

        const ChildModel = class extends ParentModel {};
        const childFlow = createAutoFlowDefinition();
        ChildModel.registerFlow(childFlow);

        const parentFlows = ParentModel.getFlows();
        const childFlows = ChildModel.getFlows();

        expect(parentFlows.size).toBe(1);
        expect(parentFlows.has(parentFlow.key)).toBe(true);

        expect(childFlows.size).toBe(2);
        expect(childFlows.has(parentFlow.key)).toBe(true);
        expect(childFlows.has(childFlow.key)).toBe(true);
      });
    });
  });

  // ==================== FLOW EXECUTION ====================
  describe('Flow Execution', () => {
    let model: FlowModel;
    let TestFlowModel: typeof FlowModel<DefaultStructure>;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel {
        static name = `TestModel_${Math.random().toString(36).substring(2, 11)}`;
      };
      model = new TestFlowModel(modelOptions);
    });

    describe('applyFlow', () => {
      test('should execute simple flow successfully', async () => {
        const flow = createBasicFlowDefinition();
        TestFlowModel.registerFlow(flow);

        const result = await model.applyFlow(flow.key);

        expect(result).toEqual({
          step1: 'step1-result',
          step2: 'step2-result',
        });
        expect(flow.steps.step1.handler).toHaveBeenCalled();
        expect(flow.steps.step2.handler).toHaveBeenCalled();
      });

      test('should throw error for non-existent flow', async () => {
        await expect(model.applyFlow('nonExistentFlow')).rejects.toThrow("Flow 'nonExistentFlow' not found.");
      });

      test('should throw error when FlowEngine not available', async () => {
        const modelWithoutEngine = new TestFlowModel({ uid: 'test' } as any);
        const flow = createBasicFlowDefinition();
        TestFlowModel.registerFlow(flow);

        await expect(modelWithoutEngine.applyFlow(flow.key)).rejects.toThrow('FlowEngine not available');
      });

      test('should handle FlowExitException correctly', async () => {
        const exitFlow: FlowDefinition = {
          key: 'exitFlow',
          steps: {
            step1: {
              handler: (ctx: FlowContext<any>) => {
                ctx.exit();
                return 'should-not-reach';
              },
            },
            step2: {
              handler: vi.fn().mockReturnValue('step2-result'),
            },
          },
        };

        TestFlowModel.registerFlow(exitFlow);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result = await model.applyFlow('exitFlow');

        expect(result).toEqual({});
        expect(exitFlow.steps.step2.handler).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[FlowEngine]'));

        consoleSpy.mockRestore();
      });

      test('should propagate step execution errors', async () => {
        const errorFlow = createErrorFlowDefinition('Step execution failed');
        TestFlowModel.registerFlow(errorFlow);

        await expect(model.applyFlow(errorFlow.key)).rejects.toThrow('Step execution failed');
      });

      test('should use action when step references registered action', async () => {
        const actionHandler = vi.fn().mockResolvedValue('action-result');
        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          defaultParams: { actionParam: 'actionValue' },
        });

        const actionFlow: FlowDefinition = {
          key: 'actionFlow',
          steps: {
            actionStep: {
              use: 'testAction',
              defaultParams: { stepParam: 'stepValue' },
            },
          },
        };

        TestFlowModel.registerFlow(actionFlow);

        const result = await model.applyFlow('actionFlow');

        expect(model.flowEngine.getAction).toHaveBeenCalledWith('testAction');
        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            actionParam: 'actionValue',
            stepParam: 'stepValue',
          }),
        );
        expect(result.actionStep).toBe('action-result');
      });

      test('should skip step when action not found', async () => {
        model.flowEngine.getAction = vi.fn().mockReturnValue(null);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const actionFlow: FlowDefinition = {
          key: 'actionFlow',
          steps: {
            missingActionStep: {
              use: 'nonExistentAction',
            },
          },
        };

        TestFlowModel.registerFlow(actionFlow);

        const result = await model.applyFlow('actionFlow');

        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Action 'nonExistentAction' not found"));

        consoleSpy.mockRestore();
      });
    });

    describe('applyAutoFlows', () => {
      test('should execute all auto flows', async () => {
        const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1', sort: 1 };
        const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2', sort: 2 };
        const manualFlow = createBasicFlowDefinition(); // No auto flag

        TestFlowModel.registerFlow(autoFlow1);
        TestFlowModel.registerFlow(autoFlow2);
        TestFlowModel.registerFlow(manualFlow);

        const results = await model.applyAutoFlows();

        expect(results).toHaveLength(2);
        expect(autoFlow1.steps.autoStep.handler).toHaveBeenCalled();
        expect(autoFlow2.steps.autoStep.handler).toHaveBeenCalled();
        expect(manualFlow.steps.step1.handler).not.toHaveBeenCalled();
      });

      test('should execute auto flows in sort order', async () => {
        const executionOrder: string[] = [];

        const autoFlow1 = {
          key: 'auto1',
          auto: true,
          sort: 3,
          steps: {
            step: {
              handler: () => {
                executionOrder.push('auto1');
                return 'result1';
              },
            },
          },
        };

        const autoFlow2 = {
          key: 'auto2',
          auto: true,
          sort: 1,
          steps: {
            step: {
              handler: () => {
                executionOrder.push('auto2');
                return 'result2';
              },
            },
          },
        };

        const autoFlow3 = {
          key: 'auto3',
          auto: true,
          sort: 2,
          steps: {
            step: {
              handler: () => {
                executionOrder.push('auto3');
                return 'result3';
              },
            },
          },
        };

        TestFlowModel.registerFlow(autoFlow1);
        TestFlowModel.registerFlow(autoFlow2);
        TestFlowModel.registerFlow(autoFlow3);

        await model.applyAutoFlows();

        expect(executionOrder).toEqual(['auto2', 'auto3', 'auto1']);
      });

      test('should no results when no auto flows found', async () => {
        const results = await model.applyAutoFlows();

        expect(results).toEqual([]);
        // Note: Log output may be captured in stderr, not console.log
      });
    });

    describe('dispatchEvent', () => {
      test('should execute event-triggered flows', async () => {
        const eventFlow = createEventFlowDefinition('testEvent');
        TestFlowModel.registerFlow(eventFlow);

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        try {
          model.dispatchEvent('testEvent', { data: 'payload' });

          // Use a more reliable approach than arbitrary timeout
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("dispatching event 'testEvent'"));
          expect(eventFlow.steps.eventStep.handler).toHaveBeenCalledWith(
            expect.objectContaining({
              extra: { data: 'payload' },
            }),
            expect.any(Object),
          );
        } finally {
          consoleSpy.mockRestore();
        }
      });

      test('should handle multiple flows for same event', async () => {
        const eventFlow1 = { ...createEventFlowDefinition('sharedEvent'), key: 'event1' };
        const eventFlow2 = { ...createEventFlowDefinition('sharedEvent'), key: 'event2' };

        TestFlowModel.registerFlow(eventFlow1);
        TestFlowModel.registerFlow(eventFlow2);

        model.dispatchEvent('sharedEvent');

        // Use a more reliable approach than arbitrary timeout
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(eventFlow1.steps.eventStep.handler).toHaveBeenCalled();
        expect(eventFlow2.steps.eventStep.handler).toHaveBeenCalled();
      });
    });
  });

  // ==================== RELATIONSHIPS ====================
  describe('Relationships', () => {
    let model: FlowModel;

    beforeEach(() => {
      model = new FlowModel(modelOptions);
    });

    describe('parent-child relationships', () => {
      test('should set parent correctly', () => {
        const parent = new FlowModel({ ...modelOptions, uid: 'parent' });

        model.setParent(parent);

        expect(model.parent).toBe(parent);
      });

      test('should not allow setting parent to null', () => {
        const parent = new FlowModel({ ...modelOptions, uid: 'parent' });

        model.setParent(parent);
        expect(model.parent).toBe(parent);

        expect(() => model.setParent(null as any)).toThrow('Parent must be an instance of FlowModel');
      });
    });

    describe('fork management', () => {
      test('should create fork with unique forkId', () => {
        const fork1 = model.createFork();
        const fork2 = model.createFork();

        expect(fork1.forkId).toBe(0);
        expect(fork2.forkId).toBe(1);
        expect(model.forks.size).toBe(2);
        expect(model.forks.has(fork1)).toBe(true);
        expect(model.forks.has(fork2)).toBe(true);
      });

      test('should cache fork instances with key', () => {
        const fork1 = model.createFork({}, 'cacheKey');
        const fork2 = model.createFork({}, 'cacheKey'); // Same key should return cached instance

        expect(fork1).toBe(fork2);
        expect(model.forks.size).toBe(1);
      });

      test('should create different instances for different keys', () => {
        const fork1 = model.createFork({}, 'key1');
        const fork2 = model.createFork({}, 'key2');

        expect(fork1).not.toBe(fork2);
        expect(fork1.forkId).toBe(0);
        expect(fork2.forkId).toBe(1);
      });

      test('should create fork with local props', () => {
        const localProps = { name: 'Local Fork', value: 42 };
        const fork = model.createFork(localProps);

        expect(fork.localProps).toEqual(localProps);
        expect(fork['master']).toBe(model);
      });

      test('should dispose all forks when clearing', () => {
        const fork1 = model.createFork();
        const fork2 = model.createFork();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        try {
          model.clearForks();

          expect(fork1.dispose).toHaveBeenCalled();
          expect(fork2.dispose).toHaveBeenCalled();
          expect(model.forks.size).toBe(0);
        } finally {
          consoleSpy.mockRestore();
        }
      });

      test('should handle empty forks collection when clearing', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        try {
          model.clearForks();

          expect(model.forks.size).toBe(0);
        } finally {
          consoleSpy.mockRestore();
        }
      });
    });
  });

  // ==================== LIFECYCLE ====================
  describe('Lifecycle', () => {
    let model: FlowModel;

    beforeEach(() => {
      model = new FlowModel(modelOptions);
    });

    describe('save operations', () => {
      test('should save model through FlowEngine', async () => {
        flowEngine.saveModel = vi.fn().mockResolvedValue({ success: true, id: 'saved-id' });

        const result = await model.save();

        expect(flowEngine.saveModel).toHaveBeenCalledWith(model);
        expect(result).toEqual({ success: true, id: 'saved-id' });
      });

      test('should throw error when FlowEngine not set', async () => {
        const modelWithoutEngine = new FlowModel({ uid: 'test' } as any);

        await expect(modelWithoutEngine.save()).rejects.toThrow(
          'FlowEngine is not set on this model. Please set flowEngine before saving',
        );
      });

      test('should handle save operation failures', async () => {
        const saveError = new Error('Save operation failed');
        flowEngine.saveModel = vi.fn().mockRejectedValue(saveError);

        await expect(model.save()).rejects.toThrow('Save operation failed');
        expect(flowEngine.saveModel).toHaveBeenCalledWith(model);
      });
    });

    describe('destruction operations', () => {
      test('should destroy model through FlowEngine', async () => {
        flowEngine.destroyModel = vi.fn().mockResolvedValue({ success: true });

        const result = await model.destroy();

        expect(flowEngine.destroyModel).toHaveBeenCalledWith(model.uid);
        expect(result).toEqual({ success: true });
      });

      test('should throw error when FlowEngine not available for destroy', async () => {
        const modelWithoutEngine = new FlowModel({ uid: 'test' } as any);

        await expect(modelWithoutEngine.destroy()).rejects.toThrow('FlowEngine is not set on this model');
      });

      test('should clean up resources on remove', () => {
        model.createFork();
        model.createFork();
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Mock removeModel to simulate proper fork cleanup
        flowEngine.removeModel = vi.fn().mockImplementation(() => {
          model.clearForks();
          return true;
        });

        try {
          model.setProps({ active: true });
          expect(model.forks.size).toBe(2); // Verify forks were created

          model.remove();

          expect(model.forks.size).toBe(0);
          expect(flowEngine.removeModel).toHaveBeenCalledWith(model.uid);
        } finally {
          consoleSpy.mockRestore();
        }
      });
    });

    describe('rendering operations', () => {
      test('should render model to React element for default flowModel', () => {
        const result = model.render();

        expect(result).toBeDefined();
        expect(typeof result.type).toBe('string');
        expect(typeof result.props).toBe('object');
      });

      test('should rerender with previous auto flows', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        model.applyAutoFlows = vi.fn().mockResolvedValue([]);

        try {
          await expect(model.rerender()).resolves.not.toThrow();
          expect(model.applyAutoFlows).toHaveBeenCalled();
        } finally {
          consoleSpy.mockRestore();
        }
      });
    });

    describe('serialization', () => {
      test('should serialize basic model data', () => {
        model.sortIndex = 5;
        model.setProps({ name: 'Test Model', value: 42 });
        model.setStepParams({
          flow1: { step1: { param1: 'value1' } },
        });

        const serialized = model.serialize();

        expect(serialized).toEqual({
          uid: model.uid,
          props: expect.objectContaining({ name: 'Test Model', value: 42 }),
          stepParams: expect.objectContaining({ flow1: { step1: { param1: 'value1' } } }),
          sortIndex: 5,
          subModels: expect.any(Object),
        });
      });

      test('should serialize empty model correctly', () => {
        const emptyModel = new FlowModel({
          uid: 'empty-model',
          flowEngine,
          props: {},
          stepParams: {},
          subModels: {},
        });

        const serialized = emptyModel.serialize();

        expect(serialized).toEqual({
          uid: 'empty-model',
          props: expect.any(Object),
          stepParams: expect.any(Object),
          sortIndex: expect.any(Number),
          subModels: expect.any(Object),
        });
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases & Error Handling', () => {
    test('should handle model destruction gracefully', () => {
      const model = new FlowModel(modelOptions);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      model.createFork();
      model.setProps({ testProp: 'value' });

      try {
        expect(() => model.remove()).not.toThrow();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('should handle flows with no steps', async () => {
      const emptyFlow: FlowDefinition = {
        key: 'emptyFlow',
        steps: {},
      };

      const TestModel = class extends FlowModel {
        static name = 'TestEmptyFlowModel';
      };
      TestModel.registerFlow(emptyFlow);

      const model = new TestModel(modelOptions);
      const result = await model.applyFlow('emptyFlow');

      expect(result).toEqual({});
    });

    test('should handle concurrent flow executions', async () => {
      const flow = createBasicFlowDefinition();
      const TestModel = class extends FlowModel {
        static name = 'TestConcurrentModel';
      };
      TestModel.registerFlow(flow);

      const model = new TestModel(modelOptions);

      const promises = Array.from({ length: 3 }, () => model.applyFlow(flow.key));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({
          step1: 'step1-result',
          step2: 'step2-result',
        });
      });
    });
  });
});
