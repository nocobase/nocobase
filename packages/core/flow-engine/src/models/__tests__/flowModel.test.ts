/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/sdk';
import { vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { FlowEngine } from '../../flowEngine';
import type { DefaultStructure, FlowDefinition, FlowModelOptions, ModelConstructor } from '../../types';
import { FlowModel, defineFlow } from '../flowModel';
import { ForkFlowModel } from '../forkFlowModel';
import { FlowExitException } from '../../utils';
import { RecordProxy } from '../../RecordProxy';

// 全局处理测试中的未处理 Promise rejection
const originalUnhandledRejection = process.listeners('unhandledRejection');
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (reason, promise) => {
  // 如果是我们测试中故意抛出的错误，就忽略它
  if (reason instanceof Error && reason.message === 'Test error') {
    return;
  }
  // 其他错误仍然需要处理
  originalUnhandledRejection.forEach((listener) => {
    if (typeof listener === 'function') {
      listener(reason, promise);
    }
  });
});

// // Mock dependencies
// vi.mock('uid/secure', () => ({
//   uid: vi.fn(() => 'mock-uid-' + Math.random().toString(36).substring(2, 11)),
// }));

// vi.mock('../forkFlowModel', () => ({
//   ForkFlowModel: vi.fn().mockImplementation(function (master: any, localProps: any, forkId: number) {
//     const instance = {
//       master,
//       localProps,
//       forkId,
//       setProps: vi.fn(),
//       dispose: vi.fn(),
//       disposed: false,
//     };
//     Object.setPrototypeOf(instance, ForkFlowModel.prototype);
//     return instance;
//   }),
// }));

// vi.mock('../../components/settings/wrappers/contextual/StepSettingsDialog', () => ({
//   openStepSettingsDialog: vi.fn(),
// }));

// vi.mock('../../components/settings/wrappers/contextual/StepRequiredSettingsDialog', () => ({
//   openRequiredParamsStepFormDialog: vi.fn(),
// }));

// vi.mock('lodash', async () => {
//   const actual = await vi.importActual('lodash');
//   return {
//     ...actual,
//     debounce: vi.fn((fn) => fn),
//   };
// });

// Helper functions
const createMockFlowEngine = (): FlowEngine => {
  return new FlowEngine();
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

    test('should throw error when flowEngine is missing', () => {
      expect(() => {
        new FlowModel({} as any);
      }).toThrow('FlowModel must be initialized with a FlowEngine instance.');
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
        // Since FlowModel constructor now requires flowEngine, we test the error at construction time
        expect(() => {
          new TestFlowModel({ uid: 'test' } as any);
        }).toThrow('FlowModel must be initialized with a FlowEngine instance.');
      });

      test('should handle FlowExitException correctly', async () => {
        const exitFlow: FlowDefinition = {
          key: 'exitFlow',
          steps: {
            step1: {
              handler: (ctx) => {
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
        const manualFlow = { ...createBasicFlowDefinition(), manual: true }; // Mark as manual flow

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

      describe('lifecycle hooks', () => {
        let TestFlowModelWithHooks: any;
        let beforeHookSpy: any;
        let afterHookSpy: any;
        let errorHookSpy: any;

        beforeEach(() => {
          beforeHookSpy = vi.fn();
          afterHookSpy = vi.fn();
          errorHookSpy = vi.fn();
          TestFlowModelWithHooks = class extends TestFlowModel {
            protected async beforeApplyAutoFlows(inputArgs?: Record<string, any>) {
              beforeHookSpy(inputArgs);
            }

            protected async afterApplyAutoFlows(results: any[], inputArgs?: Record<string, any>) {
              afterHookSpy(results, inputArgs);
            }

            protected async onApplyAutoFlowsError(error: Error, inputArgs?: Record<string, any>) {
              errorHookSpy(error, inputArgs);
            }
          };
        });

        test('should call lifecycle hooks in correct order', async () => {
          const autoFlow = createAutoFlowDefinition();
          TestFlowModelWithHooks.registerFlow(autoFlow);

          const modelWithHooks = new TestFlowModelWithHooks(modelOptions);
          const inputArgs = { test: 'value' };

          const results = await modelWithHooks.applyAutoFlows(inputArgs);

          // Verify hooks were called
          expect(beforeHookSpy).toHaveBeenCalledTimes(1);
          expect(afterHookSpy).toHaveBeenCalledTimes(1);
          expect(errorHookSpy).not.toHaveBeenCalled();

          // Verify hook parameters
          expect(beforeHookSpy).toHaveBeenCalledWith(inputArgs);

          expect(afterHookSpy).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ autoStep: 'auto-result' })]),
            inputArgs,
          );
        });

        test('should allow beforeApplyAutoFlows to terminate flow via ctx.exit()', async () => {
          const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1' };
          const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2' };

          const TestFlowModelWithExitHooks = class extends TestFlowModel {
            protected async beforeApplyAutoFlows(inputArgs?: Record<string, any>) {
              beforeHookSpy(inputArgs);
              throw new FlowExitException('autoFlows', this.uid);
            }

            protected async afterApplyAutoFlows(results: any[], inputArgs?: Record<string, any>) {
              afterHookSpy(results, inputArgs);
            }

            protected async onApplyAutoFlowsError(error: Error, inputArgs?: Record<string, any>) {
              errorHookSpy(error, inputArgs);
            }
          };

          // 在正确的类上注册流程
          TestFlowModelWithExitHooks.registerFlow(autoFlow1);
          TestFlowModelWithExitHooks.registerFlow(autoFlow2);

          const modelWithHooks = new TestFlowModelWithExitHooks(modelOptions);
          const results = await modelWithHooks.applyAutoFlows();

          // Should have called beforeApplyAutoFlows but not afterApplyAutoFlows
          expect(beforeHookSpy).toHaveBeenCalledTimes(1);
          expect(afterHookSpy).not.toHaveBeenCalled();
          expect(errorHookSpy).not.toHaveBeenCalled();

          // Should return empty results since flow was terminated early
          expect(results).toEqual([]);

          // Auto flows should not have been executed
          expect(autoFlow1.steps.autoStep.handler).not.toHaveBeenCalled();
          expect(autoFlow2.steps.autoStep.handler).not.toHaveBeenCalled();
        });

        test('should call onApplyAutoFlowsError when flow execution fails', async () => {
          const errorFlow = {
            key: 'errorFlow',

            steps: {
              errorStep: {
                handler: vi.fn().mockImplementation(() => {
                  throw new Error('Test error');
                }),
              },
            },
          };
          TestFlowModelWithHooks.registerFlow(errorFlow);

          const modelWithHooks = new TestFlowModelWithHooks(modelOptions);

          // 测试错误处理钩子功能
          await expect(modelWithHooks.applyAutoFlows()).rejects.toThrow('Test error');

          // Verify hooks were called
          expect(beforeHookSpy).toHaveBeenCalledTimes(1);
          expect(afterHookSpy).not.toHaveBeenCalled();
          expect(errorHookSpy).toHaveBeenCalledTimes(1);

          // Verify error hook parameters
          expect(errorHookSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'Test error',
            }),
            undefined, // inputArgs was not provided
          );
        });

        test('should provide access to step results in afterApplyAutoFlows', async () => {
          const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1' };
          const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2' };
          TestFlowModelWithHooks.registerFlow(autoFlow1);
          TestFlowModelWithHooks.registerFlow(autoFlow2);

          const modelWithHooks = new TestFlowModelWithHooks(modelOptions);
          await modelWithHooks.applyAutoFlows();

          expect(afterHookSpy).toHaveBeenCalledTimes(1);

          const [results, inputArgs] = afterHookSpy.mock.calls[0];

          // Verify results array contains results from both flows
          expect(results).toHaveLength(2);
          expect(results[0]).toEqual({ autoStep: 'auto-result' });
          expect(results[1]).toEqual({ autoStep: 'auto-result' });

          // Verify inputArgs is undefined since none was provided
          expect(inputArgs).toBeUndefined();
        });
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
              inputArgs: { data: 'payload' },
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

    describe('subModels management', () => {
      let parentModel: FlowModel;

      beforeEach(() => {
        parentModel = new FlowModel(modelOptions);
      });

      describe('setSubModel (object type)', () => {
        test('should set single subModel with FlowModel instance', () => {
          const childModel = new FlowModel({
            uid: 'child-model-uid',
            flowEngine,
            stepParams: { childFlow: { childStep: { childParam: 'childValue' } } },
          });

          const result = parentModel.setSubModel('testChild', childModel);

          expect(result.uid).toBe(childModel.uid);
          expect(result.parent).toBe(parentModel);
          expect((parentModel.subModels.testChild as FlowModel).uid).toBe(result.uid);
          expect(result.uid).toBe('child-model-uid');
        });

        test('should replace existing subModel', () => {
          const firstChild = new FlowModel({ uid: 'first-child', flowEngine });
          const secondChild = new FlowModel({ uid: 'second-child', flowEngine });

          parentModel.setSubModel('testChild', firstChild);
          const result = parentModel.setSubModel('testChild', secondChild);

          expect(result.uid).toBe(secondChild.uid);
          expect((parentModel.subModels.testChild as FlowModel).uid).toBe(result.uid);
          expect(result.uid).toBe('second-child');
        });

        test('should throw error when setting model with existing parent', () => {
          const childModel = new FlowModel({ uid: 'child-with-parent', flowEngine });
          const otherParent = new FlowModel({ uid: 'other-parent', flowEngine });
          childModel.setParent(otherParent);

          expect(() => {
            parentModel.setSubModel('testChild', childModel);
          }).toThrow('Sub model already has a parent.');
        });

        test('should emit onSubModelAdded event', () => {
          const eventSpy = vi.fn();
          parentModel.emitter.on('onSubModelAdded', eventSpy);
          const childModel = new FlowModel({ uid: 'test-child', flowEngine });

          const result = parentModel.setSubModel('testChild', childModel);

          expect(eventSpy).toHaveBeenCalledWith(result);
        });
      });

      describe('addSubModel (array type)', () => {
        test('should add subModel to array with FlowModel instance', () => {
          const childModel = new FlowModel({
            uid: 'child-model-uid',
            flowEngine,
          });

          const result = parentModel.addSubModel('testChildren', childModel);

          expect(result.uid).toBe(childModel.uid);
          expect(result.parent).toBe(parentModel);
          expect(Array.isArray(parentModel.subModels.testChildren)).toBe(true);
          expect((parentModel.subModels.testChildren as FlowModel[]).some((model) => model.uid === result.uid)).toBe(
            true,
          );
          expect(result.sortIndex).toBe(1);
        });

        test('should add multiple subModels with correct sortIndex', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });
          const child3 = new FlowModel({ uid: 'child3', flowEngine });

          parentModel.addSubModel('testChildren', child1);
          parentModel.addSubModel('testChildren', child2);
          parentModel.addSubModel('testChildren', child3);

          expect(child1.sortIndex).toBe(1);
          expect(child2.sortIndex).toBe(2);
          expect(child3.sortIndex).toBe(3);
          expect(parentModel.subModels.testChildren).toHaveLength(3);
        });

        test('should maintain sortIndex when adding to existing array', () => {
          const existingChild = new FlowModel({ uid: 'existing', flowEngine, sortIndex: 5 });
          (parentModel.subModels as any).testChildren = [existingChild];

          const newChild = new FlowModel({ uid: 'new-child', flowEngine });
          parentModel.addSubModel('testChildren', newChild);

          expect(newChild.sortIndex).toBe(6); // Should be max(5) + 1
        });

        test('should throw error when adding model with existing parent', () => {
          const childModel = new FlowModel({ uid: 'child-with-parent', flowEngine });
          const otherParent = new FlowModel({ uid: 'other-parent', flowEngine });
          childModel.setParent(otherParent);

          expect(() => {
            parentModel.addSubModel('testChildren', childModel);
          }).toThrow('Sub model already has a parent.');
        });

        test('should emit onSubModelAdded event', () => {
          const eventSpy = vi.fn();
          parentModel.emitter.on('onSubModelAdded', eventSpy);
          const childModel = new FlowModel({ uid: 'test-child', flowEngine });

          const result = parentModel.addSubModel('testChildren', childModel);

          expect(eventSpy).toHaveBeenCalledWith(result);
        });
      });

      describe('mapSubModels', () => {
        test('should map over array subModels', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          parentModel.addSubModel('testChildren', child1);
          parentModel.addSubModel('testChildren', child2);

          const results = parentModel.mapSubModels('testChildren', (model, index) => ({
            uid: model.uid,
            index,
          }));

          expect(results).toHaveLength(2);
          expect(results[0]).toEqual({ uid: 'child1', index: 0 });
          expect(results[1]).toEqual({ uid: 'child2', index: 1 });
        });

        test('should map over single subModel', () => {
          const child = new FlowModel({ uid: 'single-child', flowEngine });
          parentModel.setSubModel('testChild', child);

          const results = parentModel.mapSubModels('testChild', (model, index) => ({
            uid: model.uid,
            index,
          }));

          expect(results).toHaveLength(1);
          expect(results[0]).toEqual({ uid: 'single-child', index: 0 });
        });

        test('should return empty array for non-existent subModel', () => {
          const results = parentModel.mapSubModels('nonExistent', (model) => model.uid);

          expect(results).toEqual([]);
        });
      });

      describe('findSubModel', () => {
        test('should find subModel by condition in array', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          parentModel.addSubModel('testChildren', child1);
          parentModel.addSubModel('testChildren', child2);

          const found = parentModel.findSubModel('testChildren', (model) => model.uid === 'child2');

          expect(found).toBeDefined();
        });

        test('should find single subModel by condition', () => {
          const child = new FlowModel({ uid: 'target-child', flowEngine });
          parentModel.setSubModel('testChild', child);

          const found = parentModel.findSubModel('testChild', (model) => model.uid === 'target-child');

          expect(found).toBeDefined();
        });

        test('should return null when no match found', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          parentModel.addSubModel('testChildren', child1);

          const found = parentModel.findSubModel('testChildren', (model) => model.uid === 'nonexistent');

          expect(found).toBeNull();
        });

        test('should return null for non-existent subModel key', () => {
          const found = parentModel.findSubModel('nonExistent', () => true);

          expect(found).toBeNull();
        });
      });

      describe('applySubModelsAutoFlows', () => {
        test('should apply auto flows to all array subModels', async () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          child1.applyAutoFlows = vi.fn().mockResolvedValue([]);
          child2.applyAutoFlows = vi.fn().mockResolvedValue([]);

          parentModel.addSubModel('children', child1);
          parentModel.addSubModel('children', child2);

          const runtimeData = { test: 'extra' };

          await parentModel.applySubModelsAutoFlows('children', runtimeData);

          expect(child1.applyAutoFlows).toHaveBeenCalledWith(runtimeData);
          expect(child2.applyAutoFlows).toHaveBeenCalledWith(runtimeData);
        });

        test('should apply auto flows to single subModel', async () => {
          const child = new FlowModel({ uid: 'child', flowEngine });

          child.applyAutoFlows = vi.fn().mockResolvedValue([]);

          parentModel.setSubModel('child', child);

          const runtimeData = { test: 'extra' };

          await parentModel.applySubModelsAutoFlows('child', runtimeData);

          expect(child.applyAutoFlows).toHaveBeenCalledWith(runtimeData);
        });

        test('should handle empty subModels gracefully', async () => {
          await expect(parentModel.applySubModelsAutoFlows('nonExistent')).resolves.not.toThrow();
        });
      });

      describe('subModels serialization', () => {
        test('should serialize subModels in model data', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          parentModel.setSubModel('singleChild', child1);
          parentModel.addSubModel('multipleChildren', child2);

          const serialized = parentModel.serialize();

          expect(serialized.subModels).toBeDefined();
          expect(serialized.subModels.singleChild).toBeDefined();
          expect(serialized.subModels.multipleChildren).toBeDefined();
        });

        test('should handle empty subModels in serialization', () => {
          const serialized = parentModel.serialize();

          expect(serialized.subModels).toBeDefined();
          expect(typeof serialized.subModels).toBe('object');
        });
      });

      describe('subModels reactive behavior', () => {
        test('should trigger reactive updates when subModels change', () => {
          const child = new FlowModel({ uid: 'reactive-child', flowEngine });
          let reactionTriggered = false;

          // Mock a simple reaction to observe changes
          const observer = () => {
            reactionTriggered = true;
          };

          // Observe changes to subModels
          parentModel.on('subModelChanged', observer);

          // Add a subModel and verify props are reactive
          parentModel.setSubModel('reactiveTest', child);

          // Test that the subModel was added
          expect(parentModel.subModels.reactiveTest).toBeDefined();
          expect((parentModel.subModels.reactiveTest as FlowModel).uid).toBe('reactive-child');

          // Test that props are observable
          child.setProps({ reactiveTest: 'initialValue' });
          expect(child.props.reactiveTest).toBe('initialValue');

          // Change props and verify it's reactive
          child.setProps({ reactiveTest: 'updatedValue' });
          expect(child.props.reactiveTest).toBe('updatedValue');
        });

        test('should maintain reactive stepParams', () => {
          const child = new FlowModel({ uid: 'step-params-child', flowEngine });
          parentModel.setSubModel('stepParamsTest', child);

          // Set initial step params
          child.setStepParams({ testFlow: { testStep: { param1: 'initial' } } });
          expect(child.stepParams.testFlow.testStep.param1).toBe('initial');

          // Update step params and verify reactivity
          child.setStepParams({ testFlow: { testStep: { param1: 'updated', param2: 'new' } } });
          expect(child.stepParams.testFlow.testStep.param1).toBe('updated');
          expect(child.stepParams.testFlow.testStep.param2).toBe('new');
        });
      });

      describe('subModels edge cases', () => {
        test('should handle null parent gracefully', () => {
          const child = new FlowModel({ uid: 'orphan-child', flowEngine });

          expect(() => {
            parentModel.setSubModel('testChild', child);
          }).not.toThrow();

          expect(child.parent).toBe(parentModel);
        });

        test('should handle setting subModel with same key multiple times', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          parentModel.setSubModel('sameKey', child1);
          parentModel.setSubModel('sameKey', child2);

          expect((parentModel.subModels.sameKey as FlowModel).uid).toBe(child2.uid);
          expect((parentModel.subModels.sameKey as FlowModel).uid).toBe('child2');
          expect(child2.parent).toBe(parentModel);
        });

        test('should handle adding subModels to different arrays', () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          parentModel.addSubModel('arrayA', child1);
          parentModel.addSubModel('arrayB', child2);

          expect(Array.isArray(parentModel.subModels.arrayA)).toBe(true);
          expect(Array.isArray(parentModel.subModels.arrayB)).toBe(true);
          expect((parentModel.subModels.arrayA as FlowModel[]).some((model) => model.uid === child1.uid)).toBe(true);
          expect((parentModel.subModels.arrayB as FlowModel[]).some((model) => model.uid === child2.uid)).toBe(true);
          expect((parentModel.subModels.arrayA as FlowModel[]).some((model) => model.uid === child2.uid)).toBe(false);
          expect((parentModel.subModels.arrayB as FlowModel[]).some((model) => model.uid === child1.uid)).toBe(false);
        });
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

        // 手动 mock dispose 方法为 spy
        fork1.dispose = vi.fn();
        fork2.dispose = vi.fn();

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

    describe('Component Lifecycle Hooks', () => {
      test('should call onMount and onUnmount with FlowModelRenderer', () => {
        const mountSpy = vi.fn();
        const unmountSpy = vi.fn();

        class TestModel extends FlowModel {
          protected onMount(): void {
            mountSpy();
          }

          protected onUnmount(): void {
            unmountSpy();
          }

          public render(): any {
            return React.createElement('div', { 'data-testid': 'test-component' }, 'Test Component');
          }
        }

        const testModel = new TestModel(modelOptions);

        // Test with FlowModelRenderer (simulated)
        const { unmount } = render(testModel.render());

        // Verify onMount was called
        expect(mountSpy).toHaveBeenCalledTimes(1);

        // Unmount and verify onUnmount was called
        unmount();
        expect(unmountSpy).toHaveBeenCalledTimes(1);
      });

      test('should call onMount and onUnmount as children', () => {
        const mountSpy = vi.fn();
        const unmountSpy = vi.fn();

        class TestModel extends FlowModel {
          protected onMount(): void {
            mountSpy();
          }

          protected onUnmount(): void {
            unmountSpy();
          }

          public render(): any {
            return React.createElement('span', null, 'Child Component');
          }
        }

        const testModel = new TestModel(modelOptions);

        // Test as children: <TestComponent>{model.render()}</TestComponent>
        const TestComponent = ({ children }: { children: React.ReactNode }) => {
          return React.createElement('div', { 'data-testid': 'parent' }, children);
        };

        const { unmount } = render(React.createElement(TestComponent, null, testModel.render()));

        // Verify onMount was called
        expect(mountSpy).toHaveBeenCalledTimes(1);

        // Unmount and verify onUnmount was called
        unmount();
        expect(unmountSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('save operations', () => {
      test('should save model through FlowEngine', async () => {
        flowEngine.saveModel = vi.fn().mockResolvedValue({ success: true, id: 'saved-id' });

        const result = await model.save();

        expect(flowEngine.saveModel).toHaveBeenCalledWith(model);
        expect(result).toEqual({ success: true, id: 'saved-id' });
      });

      test('should throw error when FlowEngine not set', async () => {
        // Since FlowModel constructor now requires flowEngine, we test the error at construction time
        expect(() => {
          new FlowModel({ uid: 'test' } as any);
        }).toThrow('FlowModel must be initialized with a FlowEngine instance.');
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
        // Since FlowModel constructor now requires flowEngine, we test the error at construction time
        expect(() => {
          new FlowModel({ uid: 'test' } as any);
        }).toThrow('FlowModel must be initialized with a FlowEngine instance.');
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
        expect(React.isValidElement(result)).toBe(true);
        expect(typeof result.props).toBe('object');
        expect(typeof result.type).toBe('object');
        expect(result.type.displayName).toBe('ReactiveWrapper(FlowModel)');
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
      test('should serialize basic model data, excluding props and flowEngine', () => {
        model.sortIndex = 5;
        model.setProps({ name: 'Test Model', value: 42 });
        model.setStepParams({
          flow1: { step1: { param1: 'value1' } },
        });

        const serialized = model.serialize();

        expect(serialized).toEqual({
          uid: model.uid,
          stepParams: expect.objectContaining({ flow1: { step1: { param1: 'value1' } } }),
          sortIndex: 5,
          subModels: expect.any(Object),
        });
        // props should be excluded from serialization
        expect(serialized.props).toBeUndefined();
        expect(serialized.flowEngine).toBeUndefined();
      });

      test('should serialize empty model correctly', () => {
        const emptyModel = new FlowModel({
          uid: 'empty-model',
          flowEngine,
          stepParams: {},
          subModels: {},
        });

        emptyModel.setProps('foo', 'bar');

        const serialized = emptyModel.serialize();

        expect(serialized).toEqual({
          uid: 'empty-model',
          stepParams: expect.any(Object),
          sortIndex: expect.any(Number),
          subModels: expect.any(Object),
        });
        expect(serialized.flowEngine).toBeUndefined();
      });
    });
  });

  // ==================== TITLE MANAGEMENT ====================
  describe('Title Management', () => {
    let model: FlowModel;
    let TestFlowModel: any;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel {
        static name = `TestModel_${Math.random().toString(36).substring(2, 11)}`;
      };
      model = new TestFlowModel(modelOptions);
    });

    describe('title getter', () => {
      test('should return undefined when no title is set', () => {
        expect(model.title).toBeUndefined();
      });

      test('should return meta title when defined', () => {
        TestFlowModel.define({
          title: 'Test Model Title',
          group: 'test',
        });

        const modelWithMeta = new TestFlowModel(modelOptions);
        expect(modelWithMeta.title).toBe('Test Model Title');
      });

      test('should translate meta title using translate method', () => {
        TestFlowModel.define({
          title: 'model.title.key',
          group: 'test',
        });

        const mockTranslate = vi.fn((v) => {
          if (v) return 'Translated Title';
        });

        const flowEngine = new FlowEngine();
        flowEngine.translate = mockTranslate;

        const modelWithTranslate = new TestFlowModel({
          ...modelOptions,
          flowEngine,
        });

        const title = modelWithTranslate.title;

        expect(mockTranslate).toHaveBeenLastCalledWith('model.title.key');
        expect(title).toBe('Translated Title');
      });

      test('should return instance title when set via setTitle', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const modelWithBoth = new TestFlowModel(modelOptions);
        modelWithBoth.setTitle('Instance Title');

        expect(modelWithBoth.title).toBe('Instance Title');
      });

      test('should prioritize instance title over meta title', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const modelWithBoth = new TestFlowModel(modelOptions);
        modelWithBoth.setTitle('Instance Title');

        // Instance title should have higher priority
        expect(modelWithBoth.title).toBe('Instance Title');
        expect(modelWithBoth.title).not.toBe('Meta Title');
      });

      test('should fall back to meta title when instance title is cleared', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const modelWithBoth = new TestFlowModel(modelOptions);
        modelWithBoth.setTitle('Instance Title');
        expect(modelWithBoth.title).toBe('Instance Title');

        // Clear instance title
        modelWithBoth.setTitle('');
        expect(modelWithBoth.title).toBe('Meta Title');
      });

      test('should handle null and undefined instance titles', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const modelWithMeta = new TestFlowModel(modelOptions);

        // Test with null
        modelWithMeta.setTitle(null as any);
        expect(modelWithMeta.title).toBe('Meta Title');

        // Test with undefined
        modelWithMeta.setTitle(undefined as any);
        expect(modelWithMeta.title).toBe('Meta Title');
      });
    });

    describe('setTitle method', () => {
      test('should set instance title correctly', () => {
        model.setTitle('Custom Title');
        expect(model.title).toBe('Custom Title');
      });

      test('should update title when called multiple times', () => {
        model.setTitle('First Title');
        expect(model.title).toBe('First Title');

        model.setTitle('Second Title');
        expect(model.title).toBe('Second Title');
      });

      test('should handle empty string title', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const modelWithMeta = new TestFlowModel(modelOptions);
        modelWithMeta.setTitle('Initial Title');
        expect(modelWithMeta.title).toBe('Initial Title');

        // Empty string is falsy, so it falls back to meta title
        modelWithMeta.setTitle('');
        expect(modelWithMeta.title).toBe('Meta Title');
      });

      test('should handle special characters in title', () => {
        const specialTitle = 'Title with 特殊字符 & symbols!@#$%^&*()';
        model.setTitle(specialTitle);
        expect(model.title).toBe(specialTitle);
      });
    });

    describe('title inheritance', () => {
      test('should not inherit meta title from parent class by default', () => {
        const ParentModel = class extends FlowModel {
          static name = 'ParentModel';
        };
        ParentModel.define({
          title: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {
          static name = 'ChildModel';
        };

        const parentInstance = new ParentModel(modelOptions);
        const childInstance = new ChildModel(modelOptions);

        expect(parentInstance.title).toBe('Parent Title');
        // Child class doesn't inherit parent meta by default
        expect(childInstance.title).toBeUndefined();
      });

      test('should override parent meta title with child meta title', () => {
        const ParentModel = class extends FlowModel {
          static name = 'ParentModel';
        };
        ParentModel.define({
          title: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {
          static name = 'ChildModel';
        };
        ChildModel.define({
          title: 'Child Title',
          group: 'child',
        });

        const parentInstance = new ParentModel(modelOptions);
        const childInstance = new ChildModel(modelOptions);

        expect(parentInstance.title).toBe('Parent Title');
        expect(childInstance.title).toBe('Child Title');
      });

      test('should allow instance title to override meta title', () => {
        const ParentModel = class extends FlowModel {
          static name = 'ParentModel';
        };
        ParentModel.define({
          title: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {
          static name = 'ChildModel';
        };
        ChildModel.define({
          title: 'Child Title',
          group: 'child',
        });

        const childInstance = new ChildModel(modelOptions);
        expect(childInstance.title).toBe('Child Title');

        childInstance.setTitle('Instance Override');
        expect(childInstance.title).toBe('Instance Override');
      });
    });

    describe('title with translation', () => {
      test('should call translate method for meta title', () => {
        const mockTranslate = vi.fn((v) => {
          if (v) return 'Translated Meta Title';
        });

        TestFlowModel.define({
          title: 'meta.title.key',
          group: 'test',
        });

        const flowEngine = new FlowEngine();
        flowEngine.translate = mockTranslate;

        const modelWithTranslate = new TestFlowModel({
          ...modelOptions,
          flowEngine,
        });

        const title = modelWithTranslate.title;

        expect(mockTranslate).toHaveBeenLastCalledWith('meta.title.key');
        expect(title).toBe('Translated Meta Title');
      });
    });

    describe('title serialization', () => {
      test('should not include instance title in serialization by default', () => {
        model.setTitle('Instance Title');
        const serialized = model.serialize();

        // Instance title should not be included in serialization
        expect(serialized).not.toHaveProperty('title');
        expect(serialized).not.toHaveProperty('_title');
      });

      // this means after deserialization, should set title in some flow step
      test('should maintain title after serialization/deserialization cycle', () => {
        TestFlowModel.define({
          title: 'Meta Title',
          group: 'test',
        });

        const originalModel = new TestFlowModel(modelOptions);
        originalModel.setTitle('Instance Title');

        const serialized = originalModel.serialize();
        const newModel = new TestFlowModel({
          ...serialized,
          flowEngine,
        });

        // Meta title should be available
        expect(newModel.title).toBe('Meta Title');

        // Instance title needs to be set again
        newModel.setTitle('Instance Title');
        expect(newModel.title).toBe('Instance Title');
      });
    });
  });

  // ==================== CACHE INVALIDATION ====================
  describe('Cache Invalidation', () => {
    let model: FlowModel;
    let realFlowEngine: FlowEngine;
    let deleteSpy: any;

    beforeEach(() => {
      realFlowEngine = new FlowEngine();
      deleteSpy = vi.spyOn(realFlowEngine.applyFlowCache, 'delete');

      // Mock generateApplyFlowCacheKey static method
      vi.spyOn(FlowEngine, 'generateApplyFlowCacheKey').mockImplementation(
        (prefix: string, type: string, modelUid: string) => `${prefix}-${type}-${modelUid}`,
      );

      model = new FlowModel({
        uid: 'test-model-uid',
        flowEngine: realFlowEngine,
        stepParams: {},
        subModels: {},
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('invalidateAutoFlowCache', () => {
      test('should delete auto flow cache for current model', () => {
        const expectedCacheKey = 'autoFlow-all-test-model-uid';
        realFlowEngine.applyFlowCache.set(expectedCacheKey, {
          status: 'resolved',
          data: [],
          promise: Promise.resolve([]),
        });

        model.invalidateAutoFlowCache();

        expect(deleteSpy).toHaveBeenCalledWith(expectedCacheKey);
      });

      test('should delete cache entries for all forks', () => {
        const fork1 = model.createFork();
        const fork2 = model.createFork();

        const fork1CacheKey = `${fork1.forkId}-all-test-model-uid`;
        const fork2CacheKey = `${fork2.forkId}-all-test-model-uid`;

        realFlowEngine.applyFlowCache.set(fork1CacheKey, {
          status: 'resolved',
          data: [],
          promise: Promise.resolve([]),
        });
        realFlowEngine.applyFlowCache.set(fork2CacheKey, {
          status: 'resolved',
          data: [],
          promise: Promise.resolve([]),
        });

        model.invalidateAutoFlowCache();

        expect(deleteSpy).toHaveBeenCalledWith(fork1CacheKey);
        expect(deleteSpy).toHaveBeenCalledWith(fork2CacheKey);
      });

      test('should recursively invalidate cache for array subModels', () => {
        const childModel1 = new FlowModel({ uid: 'child1', flowEngine: realFlowEngine });
        const childModel2 = new FlowModel({ uid: 'child2', flowEngine: realFlowEngine });

        const child1Spy = vi.spyOn(childModel1, 'invalidateAutoFlowCache');
        const child2Spy = vi.spyOn(childModel2, 'invalidateAutoFlowCache');

        model.addSubModel('children', childModel1);
        model.addSubModel('children', childModel2);

        model.invalidateAutoFlowCache(true);

        expect(child1Spy).toHaveBeenCalledWith(true);
        expect(child2Spy).toHaveBeenCalledWith(true);
      });

      test('should recursively invalidate cache for object subModels', () => {
        const childModel = new FlowModel({ uid: 'child', flowEngine: realFlowEngine });
        const childSpy = vi.spyOn(childModel, 'invalidateAutoFlowCache');

        model.setSubModel('child', childModel);

        model.invalidateAutoFlowCache(true);

        expect(childSpy).toHaveBeenCalledWith(true);
      });

      test('should handle mixed array and object subModels', () => {
        const arrayChild1 = new FlowModel({ uid: 'arrayChild1', flowEngine: realFlowEngine });
        const arrayChild2 = new FlowModel({ uid: 'arrayChild2', flowEngine: realFlowEngine });
        const objectChild = new FlowModel({ uid: 'objectChild', flowEngine: realFlowEngine });

        const array1Spy = vi.spyOn(arrayChild1, 'invalidateAutoFlowCache');
        const array2Spy = vi.spyOn(arrayChild2, 'invalidateAutoFlowCache');
        const objectSpy = vi.spyOn(objectChild, 'invalidateAutoFlowCache');

        model.addSubModel('arrayChildren', arrayChild1);
        model.addSubModel('arrayChildren', arrayChild2);
        model.setSubModel('objectChild', objectChild);

        model.invalidateAutoFlowCache(true);

        expect(array1Spy).toHaveBeenCalledWith(true);
        expect(array2Spy).toHaveBeenCalledWith(true);
        expect(objectSpy).toHaveBeenCalledWith(true);
      });

      test('should handle empty subModels without error', () => {
        model.invalidateAutoFlowCache();

        expect(deleteSpy).toHaveBeenCalledWith('autoFlow-all-test-model-uid');
      });

      test('should handle null flowEngine gracefully', () => {
        const modelWithValidEngine = new FlowModel({ uid: 'test', flowEngine: realFlowEngine });
        modelWithValidEngine.flowEngine = null;

        expect(() => {
          modelWithValidEngine.invalidateAutoFlowCache();
        }).not.toThrow();
      });

      test('should pass deep parameter to recursive calls', () => {
        const childModel = new FlowModel({ uid: 'child', flowEngine: realFlowEngine });
        const childSpy = vi.spyOn(childModel, 'invalidateAutoFlowCache');

        model.setSubModel('child', childModel);

        model.invalidateAutoFlowCache(true);

        expect(childSpy).toHaveBeenCalledWith(true);
      });
    });
  });

  // ==================== EXPRESSION RESOLUTION ====================
  describe('Expression Resolution', () => {
    let model: FlowModel;
    let TestFlowModel: typeof FlowModel;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel<any> {
        static name = `TestModel_${Math.random().toString(36).substring(2, 11)}`;
      };
      model = new TestFlowModel({
        ...modelOptions,
        uid: 'test-expression-model-uid',
      });
    });

    describe('{{ctx.xxx.yyy.zzz}} expression resolution', () => {
      test('should resolve simple ctx expressions in step parameters', async () => {
        const flow: FlowDefinition = {
          key: 'expressionFlow',

          steps: {
            testStep: {
              handler: vi.fn().mockImplementation((ctx, params) => {
                // 验证表达式被正确解析
                expect(params.message).toBe('Hello Test User');
                expect(params.id).toBe('user123');
                return 'resolved';
              }),
              defaultParams: {
                message: 'Hello {{ctx.user.name}}',
                id: '{{ctx.user.id}}',
              },
            },
          },
        };

        TestFlowModel.registerFlow(flow);

        model.context.defineProperty('user', {
          get: () => {
            return {
              name: 'Test User',
              id: 'user123',
            };
          },
        });

        const handlerSpy = flow.steps.testStep.handler as any;
        await model.applyAutoFlows();
        expect(handlerSpy).toHaveBeenCalled();
      });

      test('should resolve nested ctx expressions with multiple levels', async () => {
        const flow: FlowDefinition = {
          key: 'nestedExpressionFlow',

          steps: {
            nestedStep: {
              handler: vi.fn().mockImplementation((ctx, params) => {
                expect(params.authorName).toBe('John Doe');
                expect(params.authorEmail).toBe('john@example.com');
                expect(params.config).toBe('production');
                return 'nested-resolved';
              }),
              defaultParams: {
                authorName: '{{ctx.article.author.profile.name}}',
                authorEmail: '{{ctx.article.author.profile.email}}',
                config: '{{ctx.app.settings.environment}}',
              },
            },
          },
        };

        TestFlowModel.registerFlow(flow);

        model.context.defineProperty('article', {
          get: () => ({
            author: {
              profile: {
                name: 'John Doe',
                email: 'john@example.com',
              },
            },
          }),
        });

        model.context.defineProperty('app', {
          get: () => ({
            settings: {
              environment: 'production',
            },
          }),
        });

        const handlerSpy = flow.steps.nestedStep.handler as any;
        await model.applyAutoFlows();
        expect(handlerSpy).toHaveBeenCalled();
      });

      test('should resolve async expressions with RecordProxy', async () => {
        const flow: FlowDefinition = {
          key: 'asyncRecordFlow',

          steps: {
            asyncStep: {
              handler: vi.fn().mockImplementation((ctx, params) => {
                // 验证表达式被正确解析
                expect(params.authorName).toBe('Jane Smith');
                expect(params.categoryName).toBe('Technology');
                expect(params.tagCount).toBe(3);
                return 'async-resolved';
              }),
              defaultParams: {
                authorName: '{{ctx.asyncRecord.author.name}}',
                categoryName: '{{ctx.asyncRecord.category.title}}',
                tagCount: '{{ctx.asyncRecord.tags.length}}',
              },
            },
          },
        };

        // 模拟基础记录数据
        const mockRecord = {
          id: 1,
          title: 'Test Article',
        };

        // 创建模拟 Collection
        const mockCollection = {
          name: 'articles',
          filterTargetKey: 'id',
          getField: vi.fn().mockImplementation((fieldName) => {
            const fields = {
              author: { type: 'belongsTo', isAssociationField: () => true, targetCollection: mockAuthorCollection },
              category: { type: 'belongsTo', isAssociationField: () => true, targetCollection: mockCategoryCollection },
              tags: { type: 'hasMany', isAssociationField: () => true, targetCollection: mockTagCollection },
            };
            return fields[fieldName] || { isAssociationField: () => false };
          }),
        };

        const mockAuthorCollection = {
          name: 'users',
          getField: () => ({ isAssociationField: () => false }),
        };

        const mockCategoryCollection = {
          name: 'categories',
          getField: () => ({ isAssociationField: () => false }),
        };

        const mockTagCollection = {
          name: 'tags',
          getField: () => ({ isAssociationField: () => false }),
        };

        // 模拟 API 客户端
        const mockApiClient = {
          resource: vi.fn().mockImplementation((resourceName) => ({
            get: vi.fn().mockImplementation(() => {
              if (resourceName === 'articles.author') {
                return Promise.resolve({
                  data: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
                });
              }
              if (resourceName === 'articles.category') {
                return Promise.resolve({
                  data: { id: 3, title: 'Technology', slug: 'tech' },
                });
              }
              if (resourceName === 'articles.tags') {
                return Promise.resolve({
                  data: [
                    { id: 4, name: 'React' },
                    { id: 5, name: 'TypeScript' },
                    { id: 6, name: 'Testing' },
                  ],
                  meta: { count: 3 },
                });
              }
              return Promise.resolve({ data: null });
            }),
          })),
          request: vi.fn().mockImplementation(({ url }) => {
            if (url === 'articles/1/author:get') {
              return Promise.resolve({
                data: { data: { id: 2, name: 'Jane Smith', email: 'jane@example.com' } },
              });
            }
            if (url === 'articles/1/category:get') {
              return Promise.resolve({
                data: { data: { id: 3, title: 'Technology', slug: 'tech' } },
              });
            }
            if (url === 'articles/1/tags:list') {
              return Promise.resolve({
                data: {
                  data: [
                    { id: 4, name: 'React' },
                    { id: 5, name: 'TypeScript' },
                    { id: 6, name: 'Testing' },
                  ],
                  meta: { count: 3 },
                },
              });
            }
            return Promise.resolve({ data: { data: null } });
          }),
        };

        // 先设置 model.context
        model.context.defineProperty('api', {
          get: () => mockApiClient,
        });

        model.context.defineProperty('record', {
          get: () => mockRecord,
        });

        // 创建真正的RecordProxy来测试表达式解析
        const realRecord = { id: 1, title: 'Test Article' };
        const recordProxy = new RecordProxy(realRecord, mockCollection as any, model.context);

        model.context.defineProperty('asyncRecord', {
          get: () => recordProxy,
        });

        TestFlowModel.registerFlow(flow);

        const handlerSpy = flow.steps.asyncStep.handler as any;
        await model.applyAutoFlows();
        expect(handlerSpy).toHaveBeenCalled();

        // 验证真正的RecordProxy API调用
        expect(mockApiClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'articles/1/author:get',
          }),
        );
        expect(mockApiClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'articles/1/category:get',
          }),
        );
        expect(mockApiClient.request).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'articles/1/tags:list',
          }),
        );
      });

      test('should handle mixed sync and async expressions', async () => {
        const flow: FlowDefinition = {
          key: 'mixedFlow',

          steps: {
            mixedStep: {
              handler: vi.fn().mockImplementation((ctx, params) => {
                expect(params.title).toBe('Article: Test Article');
                expect(params.userId).toBe(123);
                expect(params.authorName).toBe('Alice Brown');
                expect(params.timestamp).toContain('2024');
                return 'mixed-resolved';
              }),
              defaultParams: {
                title: 'Article: {{ctx.record.title}}', // 同步访问
                userId: '{{ctx.user.id}}', // 同步访问
                authorName: '{{ctx.asyncRecord.author.name}}', // 异步访问
                timestamp: '{{ctx.getCurrentTime()}}', // 函数调用
              },
            },
          },
        };

        // 设置同步数据
        model.context.defineProperty('record', {
          get: () => ({ title: 'Test Article' }),
        });

        model.context.defineProperty('user', {
          get: () => ({ id: 123, name: 'Current User' }),
        });

        // 设置函数
        model.context.defineProperty('getCurrentTime', {
          get: () => () => '2024-01-01T12:00:00Z',
        });

        // 设置异步数据
        const mockRecord = { id: 1 };
        const mockCollection = {
          name: 'articles',
          filterTargetKey: 'id',
          getField: vi.fn().mockImplementation((fieldName) => {
            if (fieldName === 'author') {
              return {
                type: 'belongsTo',
                isAssociationField: () => true,
                targetCollection: { name: 'users', getField: () => ({ isAssociationField: () => false }) },
              };
            }
            return { isAssociationField: () => false };
          }),
        };

        const mockApiClient = {
          resource: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({
              data: { id: 2, name: 'Alice Brown' },
            }),
          }),
          request: vi.fn().mockImplementation(({ url }) => {
            if (url === 'articles/1/author:get') {
              return Promise.resolve({
                data: { data: { id: 2, name: 'Alice Brown' } },
              });
            }
            return Promise.resolve({ data: { data: null } });
          }),
        };

        model.context.defineProperty('api', {
          get: () => mockApiClient,
        });

        // 使用静态对象测试表达式解析
        model.context.defineProperty('asyncRecord', {
          get: () => new RecordProxy(mockRecord, mockCollection as any, model.context),
        });

        TestFlowModel.registerFlow(flow);

        const handlerSpy = flow.steps.mixedStep.handler as any;
        await model.applyAutoFlows();
        expect(handlerSpy).toHaveBeenCalled();
      });

      test('should handle deeply nested async expressions', async () => {
        const flow: FlowDefinition = {
          key: 'deepAsyncFlow',

          steps: {
            deepStep: {
              handler: vi.fn().mockImplementation((ctx, params) => {
                expect(params.companyName).toBe('Tech Corp');
                expect(params.departmentCode).toBe('ENG-001');
                expect(params.managerEmail).toBe('manager@techcorp.com');
                return 'deep-resolved';
              }),
              defaultParams: {
                companyName: '{{ctx.asyncRecord.author.profile.company.name}}',
                departmentCode: '{{ctx.asyncRecord.author.profile.department.code}}',
                managerEmail: '{{ctx.asyncRecord.author.profile.department.manager.email}}',
              },
            },
          },
        };

        const mockRecord = { id: 1 };

        // 创建层次化的模拟集合
        const mockCompanyCollection = {
          name: 'companies',
          getField: () => ({ isAssociationField: () => false }),
        };

        const mockDepartmentCollection = {
          name: 'departments',
          getField: vi.fn().mockImplementation((fieldName) => {
            if (fieldName === 'manager') {
              return {
                type: 'belongsTo',
                isAssociationField: () => true,
                targetCollection: mockUserCollection,
              };
            }
            return { isAssociationField: () => false };
          }),
        };

        const mockUserCollection = {
          name: 'users',
          getField: () => ({ isAssociationField: () => false }),
        };

        const mockProfileCollection = {
          name: 'profiles',
          getField: vi.fn().mockImplementation((fieldName) => {
            if (fieldName === 'company') {
              return {
                type: 'belongsTo',
                isAssociationField: () => true,
                targetCollection: mockCompanyCollection,
              };
            }
            if (fieldName === 'department') {
              return {
                type: 'belongsTo',
                isAssociationField: () => true,
                targetCollection: mockDepartmentCollection,
              };
            }
            return { isAssociationField: () => false };
          }),
        };

        const mockAuthorCollection = {
          name: 'users',
          getField: vi.fn().mockImplementation((fieldName) => {
            if (fieldName === 'profile') {
              return {
                type: 'hasOne',
                isAssociationField: () => true,
                targetCollection: mockProfileCollection,
              };
            }
            return { isAssociationField: () => false };
          }),
        };

        const mockArticleCollection = {
          name: 'articles',
          filterTargetKey: 'id',
          getField: vi.fn().mockImplementation((fieldName) => {
            if (fieldName === 'author') {
              return {
                type: 'belongsTo',
                isAssociationField: () => true,
                targetCollection: mockAuthorCollection,
              };
            }
            return { isAssociationField: () => false };
          }),
        };

        const mockApiClient = {
          request: vi.fn().mockImplementation(({ url }) => {
            if (url === 'articles/1/author:get') {
              return Promise.resolve({ data: { data: { id: 2, name: 'Author Name' } } });
            }
            if (url === 'users/2/profile:get') {
              return Promise.resolve({ data: { data: { id: 3, bio: 'Author bio' } } });
            }
            if (url === 'profiles/3/company:get') {
              return Promise.resolve({ data: { data: { id: 4, name: 'Tech Corp' } } });
            }
            if (url === 'profiles/3/department:get') {
              return Promise.resolve({ data: { data: { id: 5, code: 'ENG-001', name: 'Engineering' } } });
            }
            if (url === 'departments/5/manager:get') {
              return Promise.resolve({
                data: { data: { id: 6, name: 'Manager Name', email: 'manager@techcorp.com' } },
              });
            }
            return Promise.resolve({ data: { data: null } });
          }),
        };

        model.context.defineProperty('api', {
          get: () => mockApiClient,
        });

        // 使用静态深层嵌套对象测试表达式解析
        model.context.defineProperty('asyncRecord', {
          get: () => new RecordProxy(mockRecord, mockArticleCollection as any, model.context),
        });

        TestFlowModel.registerFlow(flow);

        const handlerSpy = flow.steps.deepStep.handler as any;
        await model.applyAutoFlows();
        expect(handlerSpy).toHaveBeenCalled();
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
