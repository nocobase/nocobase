/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@nocobase/flow-engine';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { FlowModelRenderer } from '../../components/FlowModelRenderer';
import { FlowEngineProvider } from '../../provider';
import { FlowEngine } from '../../flowEngine';
import type { DefaultStructure, FlowDefinitionOptions, FlowModelOptions } from '../../types';
import { FlowExitException } from '../../utils';
import { FlowExitAllException } from '../../utils/exceptions';
import { FlowModel, ModelRenderMode } from '../flowModel';

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

const createBasicFlowDefinition = (overrides: Partial<FlowDefinitionOptions> = {}): FlowDefinitionOptions => ({
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

const createAutoFlowDefinition = (overrides: Partial<FlowDefinitionOptions> = {}): FlowDefinitionOptions => ({
  key: 'autoFlow',
  sort: 1,
  steps: {
    autoStep: {
      handler: vi.fn().mockResolvedValue('auto-result'),
    },
  },
  ...overrides,
});

const createEventFlowDefinition = (
  eventName: string,
  overrides: Partial<FlowDefinitionOptions> = {},
): FlowDefinitionOptions => ({
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
  overrides: Partial<FlowDefinitionOptions> = {},
): FlowDefinitionOptions => ({
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
  // Mock api for FlowEngineContext
  (flowEngine.context as any).api = {
    auth: {
      role: 'admin',
      locale: 'en-US',
      token: 'mock-token',
    },
  };
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

      test.skip('should be reactive', async () => {
        reaction(
          () => model.props.foo, // 观察的字段
          (newProps, oldProps) => {
            console.log('Props changed from', oldProps, 'to', newProps);
          },
        );
        model.props.foo = 'bar';
        model.props.foo = 'baz';
        model.setProps({ foo: 'bar' });
        model.setProps({ foo: 'baz' });
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

      test('should emit onStepParamsChanged when params updated', () => {
        const listener = vi.fn();
        model.emitter.on('onStepParamsChanged', listener);

        model.setStepParams('flow1', 'step1', { foo: 'bar' });

        expect(listener).toHaveBeenCalledTimes(1);

        model.emitter.off('onStepParamsChanged', listener);
      });
    });
  });

  // ==================== FLOW MANAGEMENT ====================
  describe('Flow Management', () => {
    // TODO: design and add tests for flows management
    let TestFlowModel: typeof FlowModel;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel<any> {};
    });

    it('placeholder test - should create FlowModel subclass', () => {
      expect(TestFlowModel).toBeDefined();
      expect(TestFlowModel.prototype).toBeInstanceOf(FlowModel);
    });
  });

  // ==================== FLOW EXECUTION ====================
  describe('Flow Execution', () => {
    let model: FlowModel;
    let TestFlowModel: typeof FlowModel<DefaultStructure>;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel {};
      model = new TestFlowModel(modelOptions);
    });

    describe('applyFlow', () => {
      test('should throw error for non-existent flow', async () => {
        await expect(model.applyFlow('nonExistentFlow')).rejects.toThrow("Flow 'nonExistentFlow' not found.");
      });

      test('should throw error when FlowEngine not available', async () => {
        // Since FlowModel constructor now requires flowEngine, we test the error at construction time
        expect(() => {
          new TestFlowModel({ uid: 'test' } as any);
        }).toThrow('FlowModel must be initialized with a FlowEngine instance.');
      });

      test('should handle ctx.exit() as FlowExitAllException in applyFlow', async () => {
        const exitFlow: FlowDefinitionOptions = {
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

        expect(result).toBeInstanceOf(FlowExitAllException);
        expect(exitFlow.steps.step2.handler).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[FlowModel]'));

        consoleSpy.mockRestore();
      });

      test('should handle ctx.exit() as FlowExitAllException in beforeRender dispatch', async () => {
        const exitFlow: FlowDefinitionOptions = {
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

        const exitFlow2: FlowDefinitionOptions = {
          key: 'exitFlow2',
          steps: {
            step2: {
              handler: vi.fn().mockReturnValue('step2-result'),
            },
          },
        };

        TestFlowModel.registerFlow(exitFlow);
        TestFlowModel.registerFlow(exitFlow2);
        const loggerSpy = vi.spyOn(model.context.logger, 'info').mockImplementation(() => {});

        await model.dispatchEvent('beforeRender');

        expect(exitFlow.steps.step2.handler).not.toHaveBeenCalled();
        expect(exitFlow2.steps.step2.handler).not.toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[FlowEngine]'));

        loggerSpy.mockRestore();
      });

      test('should handle FlowExitAllException correctly', async () => {
        const exitFlow: FlowDefinitionOptions = {
          key: 'exitFlow',
          steps: {
            step1: {
              handler: (ctx) => {
                ctx.exitAll();
                return 'should-not-reach';
              },
            },
            step2: {
              handler: vi.fn().mockReturnValue('step2-result'),
            },
          },
        };

        const exitFlow2: FlowDefinitionOptions = {
          key: 'exitFlow2',
          steps: {
            step2: {
              handler: vi.fn().mockReturnValue('step2-result'),
            },
          },
        };

        TestFlowModel.registerFlow(exitFlow);
        TestFlowModel.registerFlow(exitFlow2);
        const loggerSpy = vi.spyOn(model.context.logger, 'info').mockImplementation(() => {});

        await model.dispatchEvent('beforeRender');

        expect(exitFlow.steps.step2.handler).not.toHaveBeenCalled();
        expect(exitFlow2.steps.step2.handler).not.toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[FlowEngine]'));

        loggerSpy.mockRestore();
      });

      test('should handle FlowExitAllException correctly', async () => {
        const exitFlow: FlowDefinitionOptions = {
          key: 'exitFlow',
          steps: {
            step1: {
              handler: (ctx) => {
                ctx.exitAll();
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

        expect(result).toBeInstanceOf(FlowExitAllException);
        expect(exitFlow.steps.step2.handler).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[FlowModel]'));

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

        const actionFlow: FlowDefinitionOptions = {
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
        const loggerSpy = vi.spyOn(model.context.logger, 'error').mockImplementation(() => {});

        const actionFlow: FlowDefinitionOptions = {
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
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining("Action 'nonExistentAction' not found"));

        loggerSpy.mockRestore();
      });
    });

    describe('beforeRender flows', () => {
      test('should execute all auto flows', async () => {
        const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1', sort: 1 };
        const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2', sort: 2 };
        const manualFlow = { ...createBasicFlowDefinition(), manual: true }; // Mark as manual flow

        TestFlowModel.registerFlow(autoFlow1);
        TestFlowModel.registerFlow(autoFlow2);
        TestFlowModel.registerFlow(manualFlow);

        const results = await model.dispatchEvent('beforeRender');

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

        await model.dispatchEvent('beforeRender');

        expect(executionOrder).toEqual(['auto2', 'auto3', 'auto1']);
      });

      test('should no results when no auto flows found', async () => {
        const results = await model.dispatchEvent('beforeRender');

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
            async onDispatchEventStart(eventName: string, _opts?: any, inputArgs?: Record<string, any>) {
              if (eventName === 'beforeRender') beforeHookSpy(inputArgs);
            }
            async onDispatchEventEnd(eventName: string, _opts?: any, inputArgs?: Record<string, any>, results?: any[]) {
              if (eventName === 'beforeRender') afterHookSpy(results, inputArgs);
            }
            async onDispatchEventError(eventName: string, _opts?: any, inputArgs?: Record<string, any>, error?: Error) {
              if (eventName === 'beforeRender') errorHookSpy(error, inputArgs);
            }
          };
        });

        test('should call lifecycle hooks in correct order', async () => {
          const autoFlow = createAutoFlowDefinition();
          TestFlowModelWithHooks.registerFlow(autoFlow);

          const modelWithHooks = new TestFlowModelWithHooks(modelOptions);
          const inputArgs = { test: 'value' };

          const results = await modelWithHooks.dispatchEvent('beforeRender', inputArgs);

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

        test("should allow onDispatchEventStart('beforeRender') to terminate flow via ctx.exit()", async () => {
          const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1' };
          const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2' };

          const TestFlowModelWithExitHooks = class extends TestFlowModel {
            async onDispatchEventStart(eventName: string, _opts?: any, inputArgs?: Record<string, any>) {
              if (eventName === 'beforeRender') {
                beforeHookSpy(inputArgs);
                throw new FlowExitException('beforeRender', this.uid);
              }
            }
            async onDispatchEventEnd(eventName: string, _o?: any, _i?: any, _r?: any[]) {
              if (eventName === 'beforeRender') afterHookSpy(_r, _i);
            }
            async onDispatchEventError(eventName: string, _o?: any, i?: any, e?: Error) {
              if (eventName === 'beforeRender') errorHookSpy(e, i);
            }
          };

          // 在正确的类上注册流程
          TestFlowModelWithExitHooks.registerFlow(autoFlow1);
          TestFlowModelWithExitHooks.registerFlow(autoFlow2);

          const modelWithHooks = new TestFlowModelWithExitHooks(modelOptions);
          const results = await modelWithHooks.dispatchEvent('beforeRender');

          // Should have called onDispatchEventStart but not onDispatchEventEnd
          expect(beforeHookSpy).toHaveBeenCalledTimes(1);
          expect(afterHookSpy).not.toHaveBeenCalled();
          expect(errorHookSpy).not.toHaveBeenCalled();

          // Should return empty results since flow was terminated early
          expect(results).toEqual([]);

          // flows should not have been executed
          expect(autoFlow1.steps.autoStep.handler).not.toHaveBeenCalled();
          expect(autoFlow2.steps.autoStep.handler).not.toHaveBeenCalled();
        });

        test("should call onDispatchEventError('beforeRender') when flow execution fails", async () => {
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
          await expect(modelWithHooks.dispatchEvent('beforeRender')).rejects.toThrow('Test error');
          // Verify hooks were called (error path)
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

        test('should provide access to step results in onDispatchEventEnd(beforeRender)', async () => {
          const autoFlow1 = { ...createAutoFlowDefinition(), key: 'auto1' };
          const autoFlow2 = { ...createAutoFlowDefinition(), key: 'auto2' };
          TestFlowModelWithHooks.registerFlow(autoFlow1);
          TestFlowModelWithHooks.registerFlow(autoFlow2);

          const modelWithHooks = new TestFlowModelWithHooks(modelOptions);
          await modelWithHooks.dispatchEvent('beforeRender');

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

          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('[FlowModel] dispatchEvent: uid=test-model-uid, event=testEvent'),
          );
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

      test('getFlows includes beforeRender and no-on flows; excludes manual and other events', async () => {
        const TestM = class extends FlowModel {};
        const beforeHandler = vi.fn();
        const noOnHandler = vi.fn();
        const manualHandler = vi.fn();

        TestM.registerFlow({ key: 'beforeA', on: 'beforeRender', sort: 2, steps: { s: { handler: beforeHandler } } });
        TestM.registerFlow({ key: 'noOnB', sort: 1, steps: { s: { handler: noOnHandler } } });
        TestM.registerFlow({ key: 'manualSkip', manual: true, steps: { s: { handler: manualHandler } } });
        TestM.registerFlow({ key: 'otherEvent', on: 'click', steps: { s: { handler: vi.fn() } } });

        const m = new TestM(modelOptions);
        const autoKeys = m.getEventFlows('beforeRender').map((f) => f.key);

        // sort 按 1,2 排序：noOnB -> beforeA
        expect(autoKeys).toEqual(['noOnB', 'beforeA']);

        // beforeRender 会运行两者
        await m.dispatchEvent('beforeRender');
        expect(beforeHandler).toHaveBeenCalledTimes(1);
        expect(noOnHandler).toHaveBeenCalledTimes(1);
        expect(manualHandler).not.toHaveBeenCalled();
      });

      test('beforeRender executes in sort order mixing no-on and beforeRender', async () => {
        const TestM = class extends FlowModel {};
        const calls: string[] = [];
        TestM.registerFlow({ key: 'noOn1', sort: 1, steps: { s: { handler: () => calls.push('noOn1') } } });
        TestM.registerFlow({
          key: 'before2',
          on: 'beforeRender',
          sort: 2,
          steps: { s: { handler: () => calls.push('before2') } },
        });
        TestM.registerFlow({ key: 'noOn3', sort: 3, steps: { s: { handler: () => calls.push('noOn3') } } });

        const m = new TestM(modelOptions);
        await m.dispatchEvent('beforeRender');
        expect(calls).toEqual(['noOn1', 'before2', 'noOn3']);
      });

      test("model.dispatchEvent('beforeRender') uses cache keyed by eventName", async () => {
        const TestM = class extends FlowModel {};
        const handler = vi.fn();
        TestM.registerFlow({ key: 'autoA', steps: { s: { handler } } });

        const m = new TestM(modelOptions);
        await m.dispatchEvent('beforeRender');
        await m.dispatchEvent('beforeRender');
        expect(handler).toHaveBeenCalledTimes(1);
      });

      test('invalidFlowCache should clear specific event cache', async () => {
        const TestM = class extends FlowModel {};
        const h1 = vi.fn();
        const h2 = vi.fn();
        TestM.registerFlow({ key: 'onFoo', on: 'foo', steps: { s: { handler: h1 } } });
        TestM.registerFlow({ key: 'onBar', on: 'bar', steps: { s: { handler: h2 } } });

        const m = new TestM(modelOptions);
        await m.dispatchEvent('foo', {}, { useCache: true });
        await m.dispatchEvent('bar', {}, { useCache: true });

        // cached
        await m.dispatchEvent('foo', {}, { useCache: true });
        await m.dispatchEvent('bar', {}, { useCache: true });
        expect(h1).toHaveBeenCalledTimes(1);
        expect(h2).toHaveBeenCalledTimes(1);

        // invalidate foo only
        m.invalidateFlowCache('foo');
        await m.dispatchEvent('foo', {}, { useCache: true });
        await m.dispatchEvent('bar', {}, { useCache: true });
        expect(h1).toHaveBeenCalledTimes(2);
        expect(h2).toHaveBeenCalledTimes(1);
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

      describe('debounce functionality', () => {
        test('should use debounced dispatch when debounce option is true', async () => {
          const eventFlow = createEventFlowDefinition('debouncedEvent');
          TestFlowModel.registerFlow(eventFlow);

          const _dispatchEventSpy = vi.spyOn(model as any, '_dispatchEvent');
          const _dispatchEventWithDebounceSpy = vi.spyOn(model as any, '_dispatchEventWithDebounce');

          // Test with debounce enabled
          await model.dispatchEvent('debouncedEvent', { data: 'test' }, { debounce: true, sequential: true });

          expect(_dispatchEventWithDebounceSpy).toHaveBeenCalledWith(
            'debouncedEvent',
            { data: 'test' },
            expect.objectContaining({ sequential: true }),
          );
          // _dispatchEvent is called by _dispatchEventWithDebounce after debounce
          // So we check it's called at least once eventually
          await new Promise((resolve) => setTimeout(resolve, 150));
          expect(_dispatchEventSpy).toHaveBeenCalledTimes(1);

          _dispatchEventSpy.mockRestore();
          _dispatchEventWithDebounceSpy.mockRestore();
        });

        test('should use normal dispatch when debounce option is false', async () => {
          const eventFlow = createEventFlowDefinition('normalEvent');
          TestFlowModel.registerFlow(eventFlow);

          const _dispatchEventSpy = vi.spyOn(model as any, '_dispatchEvent');
          const _dispatchEventWithDebounceSpy = vi.spyOn(model as any, '_dispatchEventWithDebounce');

          // Test with debounce disabled
          await model.dispatchEvent('normalEvent', { data: 'test' }, { debounce: false });

          expect(_dispatchEventSpy).toHaveBeenCalledWith(
            'normalEvent',
            { data: 'test' },
            expect.objectContaining({ sequential: true }),
          );
          expect(_dispatchEventWithDebounceSpy).not.toHaveBeenCalled();

          _dispatchEventSpy.mockRestore();
          _dispatchEventWithDebounceSpy.mockRestore();
        });

        test('should use normal dispatch when debounce option is not provided', async () => {
          const eventFlow = createEventFlowDefinition('defaultEvent');
          TestFlowModel.registerFlow(eventFlow);

          const _dispatchEventSpy = vi.spyOn(model as any, '_dispatchEvent');
          const _dispatchEventWithDebounceSpy = vi.spyOn(model as any, '_dispatchEventWithDebounce');

          // Test without debounce option
          await model.dispatchEvent('defaultEvent', { data: 'test' });

          expect(_dispatchEventSpy).toHaveBeenCalledWith(
            'defaultEvent',
            { data: 'test' },
            expect.objectContaining({ sequential: true }),
          );
          expect(_dispatchEventWithDebounceSpy).not.toHaveBeenCalled();

          _dispatchEventSpy.mockRestore();
          _dispatchEventWithDebounceSpy.mockRestore();
        });

        test('should use normal dispatch when options is undefined', async () => {
          const eventFlow = createEventFlowDefinition('undefinedOptionsEvent');
          TestFlowModel.registerFlow(eventFlow);

          const _dispatchEventSpy = vi.spyOn(model as any, '_dispatchEvent');
          const _dispatchEventWithDebounceSpy = vi.spyOn(model as any, '_dispatchEventWithDebounce');

          // Test with undefined options
          await model.dispatchEvent('undefinedOptionsEvent', { data: 'test' }, undefined);

          expect(_dispatchEventSpy).toHaveBeenCalledWith(
            'undefinedOptionsEvent',
            { data: 'test' },
            expect.objectContaining({ sequential: true }),
          );
          expect(_dispatchEventWithDebounceSpy).not.toHaveBeenCalled();

          _dispatchEventSpy.mockRestore();
          _dispatchEventWithDebounceSpy.mockRestore();
        });

        test('should debounce multiple rapid calls when debounce is true', async () => {
          const eventFlow = createEventFlowDefinition('rapidEvent');
          TestFlowModel.registerFlow(eventFlow);

          const handlerSpy = eventFlow.steps.eventStep.handler as any;
          handlerSpy.mockClear();

          // Make multiple rapid calls with debounce enabled
          model.dispatchEvent('rapidEvent', { call: 1 }, { debounce: true });
          model.dispatchEvent('rapidEvent', { call: 2 }, { debounce: true });
          model.dispatchEvent('rapidEvent', { call: 3 }, { debounce: true });

          // Wait for debounce timeout (100ms + buffer)
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Only the last call should be executed due to debouncing
          expect(handlerSpy).toHaveBeenCalledTimes(1);
          expect(handlerSpy).toHaveBeenLastCalledWith(
            expect.objectContaining({
              inputArgs: expect.objectContaining({ call: 1 }),
            }),
            expect.any(Object),
          );
        });

        test('should not debounce calls when debounce is false', async () => {
          const eventFlow = createEventFlowDefinition('nonDebouncedEvent');
          TestFlowModel.registerFlow(eventFlow);

          const handlerSpy = eventFlow.steps.eventStep.handler as any;
          handlerSpy.mockClear();

          // Make multiple rapid calls with debounce disabled
          await model.dispatchEvent('nonDebouncedEvent', { call: 1 }, { debounce: false });
          await model.dispatchEvent('nonDebouncedEvent', { call: 2 }, { debounce: false });
          await model.dispatchEvent('nonDebouncedEvent', { call: 3 }, { debounce: false });

          // All calls should be executed
          expect(handlerSpy).toHaveBeenCalledTimes(3);
          expect(handlerSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              inputArgs: expect.objectContaining({ call: 1 }),
            }),
            expect.any(Object),
          );
          expect(handlerSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              inputArgs: expect.objectContaining({ call: 2 }),
            }),
            expect.any(Object),
          );
          expect(handlerSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
              inputArgs: expect.objectContaining({ call: 3 }),
            }),
            expect.any(Object),
          );
        });

        test('should handle mixed debounced and non-debounced calls correctly', async () => {
          const eventFlow = createEventFlowDefinition('mixedEvent');
          TestFlowModel.registerFlow(eventFlow);

          const handlerSpy = eventFlow.steps.eventStep.handler as any;
          handlerSpy.mockClear();

          // Make a non-debounced call
          await model.dispatchEvent('mixedEvent', { type: 'immediate' }, { debounce: false });

          // Make rapid debounced calls
          model.dispatchEvent('mixedEvent', { type: 'debounced', call: 1 }, { debounce: true });
          model.dispatchEvent('mixedEvent', { type: 'debounced', call: 2 }, { debounce: true });

          // Wait for debounce timeout
          await new Promise((resolve) => setTimeout(resolve, 150));

          // Should have immediate call + one debounced call
          expect(handlerSpy).toHaveBeenCalledTimes(2);
          expect(handlerSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              inputArgs: expect.objectContaining({ type: 'immediate' }),
            }),
            expect.any(Object),
          );
          expect(handlerSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              inputArgs: expect.objectContaining({ type: 'debounced', call: 1 }),
            }),
            expect.any(Object),
          );
        });

        test('should pass correct arguments to debounced function', async () => {
          const eventFlow = createEventFlowDefinition('argumentsEvent');
          TestFlowModel.registerFlow(eventFlow);

          const handlerSpy = eventFlow.steps.eventStep.handler as any;
          handlerSpy.mockClear();

          const inputArgs = {
            userId: 123,
            action: 'click',
            timestamp: Date.now(),
            metadata: { source: 'test' },
          };

          model.dispatchEvent('argumentsEvent', inputArgs, { debounce: true });

          // Wait for debounce timeout
          await new Promise((resolve) => setTimeout(resolve, 150));

          expect(handlerSpy).toHaveBeenCalledTimes(1);
          expect(handlerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              inputArgs: expect.objectContaining(inputArgs),
            }),
            expect.any(Object),
          );
        });
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

        test('should allow setSubModel via fork and bind to master', () => {
          const childModel = new FlowModel({ uid: 'object-child-via-fork', flowEngine });
          const fork = parentModel.createFork();

          const result = (fork as any).setSubModel('testChildObject', childModel);

          expect(result.parent).toBe(parentModel);
          expect((parentModel.subModels as any)['testChildObject']).toBe(result);
        });

        test('should allow multiple setSubModel via fork with same instance without error', () => {
          const childModel = new FlowModel({ uid: 'object-child-via-fork-2', flowEngine });
          const fork = parentModel.createFork();

          const first = (fork as any).setSubModel('testChildObject2', childModel);
          const second = (fork as any).setSubModel('testChildObject2', childModel);

          expect(first).toBe(second);
          expect(second.parent).toBe(parentModel);
          expect((parentModel.subModels as any)['testChildObject2']).toBe(second);
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

        test('should allow addSubModel via fork and bind to master', () => {
          const childModel = new FlowModel({ uid: 'child-via-fork', flowEngine });
          const fork = parentModel.createFork();

          const result = (fork as any).addSubModel('testChildren', childModel);

          expect(result.parent).toBe(parentModel);
          expect(Array.isArray(parentModel.subModels.testChildren)).toBe(true);
          expect((parentModel.subModels.testChildren as FlowModel[]).some((m) => m.uid === 'child-via-fork')).toBe(
            true,
          );
        });

        test('should allow multiple addSubModel via fork with same instance without error', () => {
          const childModel = new FlowModel({ uid: 'child-via-fork-2', flowEngine });
          const fork = parentModel.createFork();

          const r1 = (fork as any).addSubModel('testChildren2', childModel);
          const r2 = (fork as any).addSubModel('testChildren2', childModel);

          expect(r1).toBe(r2);
          expect(r1.parent).toBe(parentModel);
          const arr = (parentModel.subModels as any)['testChildren2'];
          expect(Array.isArray(arr)).toBe(true);
          // allow duplicate binding without throwing
          expect(arr.length).toBe(2);
          expect(arr[0]).toBe(childModel);
          expect(arr[1]).toBe(childModel);
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

      describe('applySubModelsBeforeRenderFlows', () => {
        test('should apply auto flows to all array subModels', async () => {
          const child1 = new FlowModel({ uid: 'child1', flowEngine });
          const child2 = new FlowModel({ uid: 'child2', flowEngine });

          child1.dispatchEvent = vi.fn().mockResolvedValue(undefined) as any;
          child2.dispatchEvent = vi.fn().mockResolvedValue(undefined) as any;

          parentModel.addSubModel('children', child1);
          parentModel.addSubModel('children', child2);

          const runtimeData = { test: 'extra' };

          await parentModel.applySubModelsBeforeRenderFlows('children', runtimeData);

          expect(child1.dispatchEvent).toHaveBeenCalledWith('beforeRender', runtimeData);
          expect(child2.dispatchEvent).toHaveBeenCalledWith('beforeRender', runtimeData);
        });

        test('should apply auto flows to single subModel', async () => {
          const child = new FlowModel({ uid: 'child', flowEngine });

          child.dispatchEvent = vi.fn().mockResolvedValue(undefined) as any;

          parentModel.setSubModel('child', child);

          const runtimeData = { test: 'extra' };

          await parentModel.applySubModelsBeforeRenderFlows('child', runtimeData);

          expect(child.dispatchEvent).toHaveBeenCalledWith('beforeRender', runtimeData);
        });

        test('should handle empty subModels gracefully', async () => {
          await expect(parentModel.applySubModelsBeforeRenderFlows('nonExistent')).resolves.not.toThrow();
        });
      });

      describe('beforeRender cache invalidation on inputArgs change', () => {
        test('should rerun when inputArgs changed and reuse when equal', async () => {
          const TestM = class extends FlowModel {};
          const handler = vi.fn();
          TestM.registerFlow({ key: 'auto1', steps: { s: { handler } } });

          const m = new TestM(modelOptions);

          // First run with {a:1}
          await m.dispatchEvent('beforeRender', { a: 1 });
          expect(handler).toHaveBeenCalledTimes(1);

          // Second run with same args should hit cache -> no extra handler calls
          await m.dispatchEvent('beforeRender', { a: 1 });
          expect(handler).toHaveBeenCalledTimes(1);

          // Different args invalidate cache -> handler called again
          await m.dispatchEvent('beforeRender', { a: 2 });
          expect(handler).toHaveBeenCalledTimes(2);
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

      test('should recreate cached fork after dispose to avoid state leakage', () => {
        const fork1 = model.createFork({ foo: 'bar' }, 'cacheKey');
        fork1.hidden = true;
        fork1.setProps({ disabled: true });

        fork1.dispose();

        expect(model.getFork('cacheKey')).toBeUndefined();

        const fork2 = model.createFork({}, 'cacheKey');

        expect(fork2).not.toBe(fork1);
        expect(fork2.hidden).toBe(false);
        expect(fork2.localProps).toEqual({});
      });

      test('should create different instances for different keys', () => {
        const fork1 = model.createFork({}, 'key1');
        const fork2 = model.createFork({}, 'key2');

        expect(fork1).not.toBe(fork2);
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
      test('should not pre-call render for RenderFunction mode and call exactly once on render', async () => {
        const renderSpy = vi.fn(() => vi.fn());

        class CallbackRenderModel extends FlowModel {
          static renderMode = ModelRenderMode.RenderFunction;
          public render(): any {
            return renderSpy();
          }
        }

        const callbackModel = new CallbackRenderModel(modelOptions);

        // Constructor should not trigger any render pre-call
        expect(renderSpy).toHaveBeenCalledTimes(0);

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
          const { unmount } = render(
            React.createElement(
              FlowEngineProvider,
              { engine: callbackModel.flowEngine },
              React.createElement(FlowModelRenderer, { model: callbackModel }),
            ),
          );
          await waitFor(() => expect(renderSpy).toHaveBeenCalledTimes(1));
          unmount();
        } finally {
          warnSpy.mockRestore();
        }
      });

      test('should not pre-call render for ReactElement mode and call exactly once on actual render', async () => {
        const renderSpy = vi.fn(() => React.createElement('div', { 'data-testid': 'elt' }, 'Elt'));

        class ElementRenderModel extends FlowModel {
          public render(): any {
            return renderSpy();
          }
        }

        const elementModel = new ElementRenderModel(modelOptions);

        // Constructor should not trigger any render pre-call
        expect(renderSpy).toHaveBeenCalledTimes(0);

        const { getByTestId, unmount } = render(
          React.createElement(
            FlowEngineProvider,
            { engine: elementModel.flowEngine },
            React.createElement(FlowModelRenderer, { model: elementModel }),
          ),
        );

        // Render should be called exactly once during mount
        await waitFor(() => expect(renderSpy).toHaveBeenCalledTimes(1));
        expect(getByTestId('elt')).toBeTruthy();

        unmount();
      });

      test('should render model to React element for default flowModel', () => {
        const result = model.render();

        expect(result).toBeDefined();
        expect(React.isValidElement(result)).toBe(true);
        expect(typeof result.props).toBe('object');
        expect(typeof result.type).toBe('object');
        expect(result.type.displayName).toBe('ReactiveWrapper(FlowModel)');
      });

      test('should rerender triggers beforeRender without cache', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        model.dispatchEvent = vi.fn().mockResolvedValue(undefined) as any;

        try {
          await expect(model.rerender()).resolves.not.toThrow();
          expect(model.dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, {
            useCache: false,
          });
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

        expect(serialized).toEqual(
          expect.objectContaining({
            uid: model.uid,
            stepParams: expect.objectContaining({ flow1: { step1: { param1: 'value1' } } }),
            sortIndex: 5,
            subModels: expect.any(Object),
          }),
        );
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

        expect(serialized).toEqual(
          expect.objectContaining({
            uid: 'empty-model',
            stepParams: expect.any(Object),
            sortIndex: expect.any(Number),
            subModels: expect.any(Object),
          }),
        );
        expect(serialized.flowEngine).toBeUndefined();
      });
    });
  });

  // ==================== TITLE MANAGEMENT ====================
  describe('Title Management', () => {
    let model: FlowModel;
    let TestFlowModel: any;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel {};
      model = new TestFlowModel(modelOptions);
    });

    describe('title getter', () => {
      test('should return undefined when no title is set', () => {
        expect(model.title).toBeUndefined();
      });

      test('should return meta title when defined', () => {
        TestFlowModel.define({
          label: 'Test Model Title',
          group: 'test',
        });

        const modelWithMeta = new TestFlowModel(modelOptions);
        expect(modelWithMeta.title).toBe('Test Model Title');
      });

      test('should translate meta title using translate method', () => {
        TestFlowModel.define({
          label: 'model.title.key',
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
          label: 'Meta Title',
          group: 'test',
        });

        const modelWithBoth = new TestFlowModel(modelOptions);
        modelWithBoth.setTitle('Instance Title');

        expect(modelWithBoth.title).toBe('Instance Title');
      });

      test('should prioritize instance title over meta title', () => {
        TestFlowModel.define({
          label: 'Meta Title',
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
          label: 'Meta Title',
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
          label: 'Meta Title',
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

      test('should be reactive when title changes', () => {
        const seen: string[] = [];
        const dispose = reaction(
          () => model.title,
          (next) => {
            if (typeof next === 'string') seen.push(next);
          },
        );

        model.setTitle('First Title');
        model.setTitle('Second Title');

        dispose();
        expect(seen).toEqual(['First Title', 'Second Title']);
      });

      test('should update title when called multiple times', () => {
        model.setTitle('First Title');
        expect(model.title).toBe('First Title');

        model.setTitle('Second Title');
        expect(model.title).toBe('Second Title');
      });

      test('should handle empty string title', () => {
        TestFlowModel.define({
          label: 'Meta Title',
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
        const ParentModel = class extends FlowModel {};
        ParentModel.define({
          label: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {};

        const parentInstance = new ParentModel(modelOptions);
        const childInstance = new ChildModel(modelOptions);

        expect(parentInstance.title).toBe('Parent Title');
        // Child class doesn't inherit parent meta by default
        expect(childInstance.title).toBeUndefined();
      });

      test('should override parent meta title with child meta title', () => {
        const ParentModel = class extends FlowModel {};
        ParentModel.define({
          label: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {};
        ChildModel.define({
          label: 'Child Title',
          group: 'child',
        });

        const parentInstance = new ParentModel(modelOptions);
        const childInstance = new ChildModel(modelOptions);

        expect(parentInstance.title).toBe('Parent Title');
        expect(childInstance.title).toBe('Child Title');
      });

      test('should allow instance title to override meta title', () => {
        const ParentModel = class extends FlowModel {};
        ParentModel.define({
          label: 'Parent Title',
          group: 'parent',
        });

        const ChildModel = class extends ParentModel {};
        ChildModel.define({
          label: 'Child Title',
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
          label: 'meta.title.key',
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
          label: 'Meta Title',
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

    describe('invalidateFlowCache', () => {
      test('should delete auto flow cache for current model', () => {
        const expectedCacheKey = 'event:beforeRender-beforeRender-test-model-uid';
        realFlowEngine.applyFlowCache.set(expectedCacheKey, {
          status: 'resolved',
          data: [],
          promise: Promise.resolve([]),
        });

        model.invalidateFlowCache('beforeRender');

        expect(deleteSpy).toHaveBeenCalledWith(expectedCacheKey);
      });

      test('should delete cache entries for all forks', () => {
        const fork1 = model.createFork();
        const fork2 = model.createFork();

        const fork1CacheKey = `event:beforeRender:${fork1.forkId}-beforeRender-test-model-uid`;
        const fork2CacheKey = `event:beforeRender:${fork2.forkId}-beforeRender-test-model-uid`;

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

        model.invalidateFlowCache('beforeRender');

        expect(deleteSpy).toHaveBeenCalledWith(fork1CacheKey);
        expect(deleteSpy).toHaveBeenCalledWith(fork2CacheKey);
      });

      test('should recursively invalidate cache for array subModels', () => {
        const childModel1 = new FlowModel({ uid: 'child1', flowEngine: realFlowEngine });
        const childModel2 = new FlowModel({ uid: 'child2', flowEngine: realFlowEngine });

        const child1Spy = vi.spyOn(childModel1, 'invalidateFlowCache');
        const child2Spy = vi.spyOn(childModel2, 'invalidateFlowCache');

        model.addSubModel('children', childModel1);
        model.addSubModel('children', childModel2);

        model.invalidateFlowCache('beforeRender', true);

        expect(child1Spy).toHaveBeenCalledWith('beforeRender', true);
        expect(child2Spy).toHaveBeenCalledWith('beforeRender', true);
      });

      test('should recursively invalidate cache for object subModels', () => {
        const childModel = new FlowModel({ uid: 'child', flowEngine: realFlowEngine });
        const childSpy = vi.spyOn(childModel, 'invalidateFlowCache');

        model.setSubModel('child', childModel);

        model.invalidateFlowCache('beforeRender', true);

        expect(childSpy).toHaveBeenCalledWith('beforeRender', true);
      });

      test('should handle mixed array and object subModels', () => {
        const arrayChild1 = new FlowModel({ uid: 'arrayChild1', flowEngine: realFlowEngine });
        const arrayChild2 = new FlowModel({ uid: 'arrayChild2', flowEngine: realFlowEngine });
        const objectChild = new FlowModel({ uid: 'objectChild', flowEngine: realFlowEngine });

        const array1Spy = vi.spyOn(arrayChild1, 'invalidateFlowCache');
        const array2Spy = vi.spyOn(arrayChild2, 'invalidateFlowCache');
        const objectSpy = vi.spyOn(objectChild, 'invalidateFlowCache');

        model.addSubModel('arrayChildren', arrayChild1);
        model.addSubModel('arrayChildren', arrayChild2);
        model.setSubModel('objectChild', objectChild);

        model.invalidateFlowCache('beforeRender', true);

        expect(array1Spy).toHaveBeenCalledWith('beforeRender', true);
        expect(array2Spy).toHaveBeenCalledWith('beforeRender', true);
        expect(objectSpy).toHaveBeenCalledWith('beforeRender', true);
      });

      test('should handle empty subModels without error', () => {
        realFlowEngine.applyFlowCache.set('event:beforeRender-beforeRender-test-model-uid', {
          status: 'resolved',
          data: [],
          promise: Promise.resolve([]),
        });

        model.invalidateFlowCache('beforeRender');

        expect(deleteSpy).toHaveBeenCalledWith('event:beforeRender-beforeRender-test-model-uid');
      });

      test('should handle null flowEngine gracefully', () => {
        const modelWithValidEngine = new FlowModel({ uid: 'test', flowEngine: realFlowEngine });
        modelWithValidEngine.flowEngine = null;

        expect(() => {
          modelWithValidEngine.invalidateFlowCache('beforeRender');
        }).not.toThrow();
      });

      test('should pass deep parameter to recursive calls', () => {
        const childModel = new FlowModel({ uid: 'child', flowEngine: realFlowEngine });
        const childSpy = vi.spyOn(childModel, 'invalidateFlowCache');

        model.setSubModel('child', childModel);

        model.invalidateFlowCache('beforeRender', true);

        expect(childSpy).toHaveBeenCalledWith('beforeRender', true);
      });
    });
  });

  // ==================== EXPRESSION RESOLUTION ====================
  describe('Expression Resolution', () => {
    let model: FlowModel;
    let TestFlowModel: typeof FlowModel;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel<any> {};
      model = new TestFlowModel({
        ...modelOptions,
        uid: 'test-expression-model-uid',
      });
    });

    describe('{{ctx.xxx.yyy.zzz}} expression resolution', () => {
      test('should resolve simple ctx expressions in step parameters', async () => {
        const flow: FlowDefinitionOptions = {
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
        await model.dispatchEvent('beforeRender');
        expect(handlerSpy).toHaveBeenCalled();
      });

      test('should resolve nested ctx expressions with multiple levels', async () => {
        const flow: FlowDefinitionOptions = {
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
        await model.dispatchEvent('beforeRender');
        expect(handlerSpy).toHaveBeenCalled();
      });
    });
  });

  // ==================== USE RAW PARAMS ====================
  describe('useRawParams Functionality', () => {
    let model: FlowModel;
    let TestFlowModel: typeof FlowModel;

    beforeEach(() => {
      TestFlowModel = class extends FlowModel<any> {};
      model = new TestFlowModel({
        ...modelOptions,
        uid: 'test-raw-params-model-uid',
      });
    });

    describe('useRawParams: true (skip expression resolution)', () => {
      test('should skip expression resolution when useRawParams is true on action', async () => {
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          // Parameters should contain raw expressions, not resolved values
          expect(params.message).toBe('Hello {{ctx.user.name}}');
          expect(params.id).toBe('{{ctx.user.id}}');
          return 'action-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: true,
          defaultParams: {
            message: 'Hello {{ctx.user.name}}',
            id: '{{ctx.user.id}}',
          },
        });

        model.flowEngine.registerActions({
          testAction: {
            name: 'testAction',
            handler: actionHandler,
            useRawParams: true,
            defaultParams: {
              message: 'Hello {{ctx.user.name}}',
              id: '{{ctx.user.id}}',
            },
          },
        });

        const actionFlow: FlowDefinitionOptions = {
          key: 'rawParamsActionFlow',
          steps: {
            rawParamsStep: {
              use: 'testAction',
            },
          },
        };

        TestFlowModel.registerFlow(actionFlow);

        model.context.defineProperty('user', {
          get: () => ({
            name: 'Test User',
            id: 'user123',
          }),
        });

        await model.applyFlow('rawParamsActionFlow');

        expect(model.flowEngine.getAction).toHaveBeenCalledWith('testAction');
        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Hello {{ctx.user.name}}',
            id: '{{ctx.user.id}}',
          }),
        );
      });

      test('should skip expression resolution when useRawParams is true on step', async () => {
        const stepHandler = vi.fn().mockImplementation((ctx, params) => {
          // Parameters should contain raw expressions, not resolved values
          expect(params.title).toBe('Article: {{ctx.record.title}}');
          expect(params.userId).toBe('{{ctx.user.id}}');
          return 'step-result';
        });

        const stepFlow: FlowDefinitionOptions = {
          key: 'rawParamsStepFlow',
          steps: {
            rawParamsStep: {
              handler: stepHandler,
              useRawParams: true,
              defaultParams: {
                title: 'Article: {{ctx.record.title}}',
                userId: '{{ctx.user.id}}',
              },
            },
          },
        };

        TestFlowModel.registerFlow(stepFlow);

        model.context.defineProperty('record', {
          get: () => ({ title: 'Test Article' }),
        });
        model.context.defineProperty('user', {
          get: () => ({ id: 123 }),
        });

        await model.applyFlow('rawParamsStepFlow');

        expect(stepHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            title: 'Article: {{ctx.record.title}}',
            userId: '{{ctx.user.id}}',
          }),
        );
      });

      test('should prioritize step useRawParams over action useRawParams', async () => {
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          // Step useRawParams: true should override action useRawParams: false
          expect(params.message).toBe('Hello {{ctx.user.name}}');
          return 'priority-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: false, // Action says resolve expressions
          defaultParams: {
            message: 'Hello {{ctx.user.name}}',
          },
        });

        const priorityFlow: FlowDefinitionOptions = {
          key: 'priorityFlow',
          steps: {
            priorityStep: {
              use: 'testAction',
              useRawParams: true, // Step overrides action
            },
          },
        };

        TestFlowModel.registerFlow(priorityFlow);

        model.context.defineProperty('user', {
          get: () => ({ name: 'Test User' }),
        });

        await model.applyFlow('priorityFlow');

        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Hello {{ctx.user.name}}',
          }),
        );
      });
    });

    describe('useRawParams: false (normal expression resolution)', () => {
      test('should resolve expressions when useRawParams is false', async () => {
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          // Parameters should be resolved
          expect(params.message).toBe('Hello Test User');
          expect(params.id).toBe('user123');
          return 'resolved-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: false,
          defaultParams: {
            message: 'Hello {{ctx.user.name}}',
            id: '{{ctx.user.id}}',
          },
        });

        const resolvedFlow: FlowDefinitionOptions = {
          key: 'resolvedFlow',
          steps: {
            resolvedStep: {
              use: 'testAction',
            },
          },
        };

        TestFlowModel.registerFlow(resolvedFlow);

        model.context.defineProperty('user', {
          get: () => ({
            name: 'Test User',
            id: 'user123',
          }),
        });

        await model.applyFlow('resolvedFlow');

        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Hello Test User',
            id: 'user123',
          }),
        );
      });
    });

    describe('useRawParams as function', () => {
      test('should evaluate useRawParams function and skip resolution when returns true', async () => {
        const useRawParamsFunction = vi.fn().mockReturnValue(true);
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          expect(params.message).toBe('Dynamic {{ctx.user.name}}');
          return 'dynamic-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: useRawParamsFunction,
          defaultParams: {
            message: 'Dynamic {{ctx.user.name}}',
          },
        });

        const dynamicFlow: FlowDefinitionOptions = {
          key: 'dynamicFlow',
          steps: {
            dynamicStep: {
              use: 'testAction',
            },
          },
        };

        TestFlowModel.registerFlow(dynamicFlow);

        model.context.defineProperty('user', {
          get: () => ({ name: 'Test User' }),
        });

        await model.applyFlow('dynamicFlow');

        expect(useRawParamsFunction).toHaveBeenCalledWith(expect.any(Object));
        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Dynamic {{ctx.user.name}}',
          }),
        );
      });

      test('should evaluate useRawParams function and resolve expressions when returns false', async () => {
        const useRawParamsFunction = vi.fn().mockReturnValue(false);
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          expect(params.message).toBe('Dynamic Test User');
          return 'dynamic-resolved-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: useRawParamsFunction,
          defaultParams: {
            message: 'Dynamic {{ctx.user.name}}',
          },
        });

        const dynamicResolvedFlow: FlowDefinitionOptions = {
          key: 'dynamicResolvedFlow',
          steps: {
            dynamicResolvedStep: {
              use: 'testAction',
            },
          },
        };

        TestFlowModel.registerFlow(dynamicResolvedFlow);

        model.context.defineProperty('user', {
          get: () => ({ name: 'Test User' }),
        });

        await model.applyFlow('dynamicResolvedFlow');

        expect(useRawParamsFunction).toHaveBeenCalledWith(expect.any(Object));
        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Dynamic Test User',
          }),
        );
      });

      test('should handle async useRawParams function', async () => {
        const asyncUseRawParamsFunction = vi.fn().mockResolvedValue(true);
        const actionHandler = vi.fn().mockImplementation((ctx, params) => {
          expect(params.message).toBe('Async {{ctx.user.name}}');
          return 'async-result';
        });

        model.flowEngine.getAction = vi.fn().mockReturnValue({
          handler: actionHandler,
          useRawParams: asyncUseRawParamsFunction,
          defaultParams: {
            message: 'Async {{ctx.user.name}}',
          },
        });

        const asyncFlow: FlowDefinitionOptions = {
          key: 'asyncFlow',
          steps: {
            asyncStep: {
              use: 'testAction',
            },
          },
        };

        TestFlowModel.registerFlow(asyncFlow);

        model.context.defineProperty('user', {
          get: () => ({ name: 'Test User' }),
        });

        await model.applyFlow('asyncFlow');

        expect(asyncUseRawParamsFunction).toHaveBeenCalledWith(expect.any(Object));
        expect(actionHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Async {{ctx.user.name}}',
          }),
        );
      });
    });

    describe('complex useRawParams scenarios', () => {
      test('should handle mixed steps with different useRawParams settings', async () => {
        const stepHandler1 = vi.fn().mockImplementation((ctx, params) => {
          // This step should have raw expressions
          expect(params.message).toBe('Raw: {{ctx.user.name}}');
          return 'raw-result';
        });

        const stepHandler2 = vi.fn().mockImplementation((ctx, params) => {
          // This step should have resolved expressions
          expect(params.message).toBe('Resolved: Test User');
          return 'resolved-result';
        });

        const mixedFlow: FlowDefinitionOptions = {
          key: 'mixedFlow',
          steps: {
            rawStep: {
              handler: stepHandler1,
              useRawParams: true,
              defaultParams: {
                message: 'Raw: {{ctx.user.name}}',
              },
            },
            resolvedStep: {
              handler: stepHandler2,
              useRawParams: false,
              defaultParams: {
                message: 'Resolved: {{ctx.user.name}}',
              },
            },
          },
        };

        TestFlowModel.registerFlow(mixedFlow);

        model.context.defineProperty('user', {
          get: () => ({ name: 'Test User' }),
        });

        const result = await model.applyFlow('mixedFlow');

        expect(result).toEqual({
          rawStep: 'raw-result',
          resolvedStep: 'resolved-result',
        });
        expect(stepHandler1).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Raw: {{ctx.user.name}}',
          }),
        );
        expect(stepHandler2).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            message: 'Resolved: Test User',
          }),
        );
      });

      test('should work with model step parameters', async () => {
        const stepHandler = vi.fn().mockImplementation((ctx, params) => {
          // Should get raw expressions since useRawParams is true
          expect(params.defaultMessage).toBe('Default: {{ctx.user.name}}');
          expect(params.modelMessage).toBe('Model: {{ctx.user.email}}');
          return 'model-params-result';
        });

        const modelParamsFlow: FlowDefinitionOptions = {
          key: 'modelParamsFlow',
          steps: {
            modelStep: {
              handler: stepHandler,
              useRawParams: true,
              defaultParams: {
                defaultMessage: 'Default: {{ctx.user.name}}',
              },
            },
          },
        };

        TestFlowModel.registerFlow(modelParamsFlow);

        // Set model step parameters
        model.setStepParams({
          modelParamsFlow: {
            modelStep: {
              modelMessage: 'Model: {{ctx.user.email}}',
            },
          },
        });

        model.context.defineProperty('user', {
          get: () => ({
            name: 'Test User',
            email: 'test@example.com',
          }),
        });

        await model.applyFlow('modelParamsFlow');

        expect(stepHandler).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            defaultMessage: 'Default: {{ctx.user.name}}',
            modelMessage: 'Model: {{ctx.user.email}}',
          }),
        );
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
      const emptyFlow: FlowDefinitionOptions = {
        key: 'emptyFlow',
        steps: {},
      };

      const TestModel = class extends FlowModel {};
      TestModel.registerFlow(emptyFlow);

      const model = new TestModel(modelOptions);
      const result = await model.applyFlow('emptyFlow');

      expect(result).toEqual({});
    });

    test('should handle concurrent flow executions', async () => {
      const flow = createBasicFlowDefinition();
      const TestModel = class extends FlowModel {};
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
