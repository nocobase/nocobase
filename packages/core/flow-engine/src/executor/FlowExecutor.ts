/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowRuntimeContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import type { FlowModel } from '../models';
import type { ActionDefinition, ApplyFlowCacheEntry, StepDefinition } from '../types';
import { FlowExitException, resolveDefaultParams, resolveExpressions } from '../utils';
import { FlowExitAllException } from '../utils/exceptions';
import { setupRuntimeContextSteps } from '../utils/setupRuntimeContextSteps';

export class FlowExecutor {
  constructor(private readonly engine: FlowEngine) {}

  /**
   * Execute a single flow on model.
   */
  async runFlow(model: FlowModel, flowKey: string, inputArgs?: Record<string, any>, runId?: string): Promise<any> {
    const flow = model.getFlow(flowKey);

    if (!flow) {
      console.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    const flowContext = new FlowRuntimeContext(model, flowKey);

    flowContext.defineProperty('reactView', {
      value: model.reactView,
    });
    flowContext.defineProperty('inputArgs', {
      value: {
        ..._.pick(model.context.currentFlow?.inputArgs, [
          'filterByTk',
          'sourceId',
          'collectionName',
          'associationName',
        ]),
        ...inputArgs,
      },
    });
    flowContext.defineProperty('runId', {
      value: runId || `run-${Date.now()}`,
    });

    let lastResult: any;
    const stepResults: Record<string, any> = flowContext.stepResults;

    // Setup steps meta and runtime mapping
    setupRuntimeContextSteps(flowContext, flow, model, flowKey);
    const stepsRuntime = flowContext.steps as Record<string, { params: any; uiSchema?: any; result?: any }>;

    const stepDefs = flow.steps; // Record<string, StepDefinition>
    for (const stepKey in stepDefs) {
      if (!Object.prototype.hasOwnProperty.call(stepDefs, stepKey)) continue;
      const step: StepDefinition = stepDefs[stepKey];
      let handler: ActionDefinition['handler'] | undefined;
      let combinedParams: Record<string, any> = {};
      let actionDefinition: ActionDefinition | undefined;
      let useRawParams: StepDefinition['useRawParams'] = step.useRawParams;

      if (step.use) {
        // Step references a registered action
        actionDefinition = model.getAction(step.use);
        if (!actionDefinition) {
          console.error(
            `BaseModel.applyFlow: Action '${step.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
          );
          continue;
        }
        handler = step.handler || actionDefinition.handler;
        useRawParams = useRawParams ?? actionDefinition.useRawParams;
        const actionDefaultParams = await resolveDefaultParams(actionDefinition.defaultParams, flowContext);
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
        combinedParams = { ...actionDefaultParams, ...stepDefaultParams };
      } else if (step.handler) {
        handler = step.handler;
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
        combinedParams = { ...stepDefaultParams };
      } else {
        console.error(
          `BaseModel.applyFlow: Step '${stepKey}' in flow '${flowKey}' has neither 'use' nor 'handler'. Skipping.`,
        );
        continue;
      }

      const modelStepParams = model.getStepParams(flowKey, stepKey);
      if (modelStepParams !== undefined) {
        combinedParams = { ...combinedParams, ...modelStepParams };
      }
      if (typeof useRawParams === 'function') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useRawParams = await useRawParams(flowContext);
      }
      if (!useRawParams) {
        combinedParams = await resolveExpressions(combinedParams, flowContext);
      }

      try {
        if (!handler) {
          console.error(
            `BaseModel.applyFlow: No handler available for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
          );
          continue;
        }
        const currentStepResult = handler(flowContext, combinedParams);
        const isAwait = step.isAwait !== false;
        lastResult = isAwait ? await currentStepResult : currentStepResult;

        // Store step result
        stepResults[stepKey] = lastResult;
        // update the context
        stepsRuntime[stepKey].result = stepResults[stepKey];
      } catch (error) {
        if (error instanceof FlowExitException) {
          console.log(`[FlowEngine] ${error.message}`);
          return Promise.resolve(stepResults);
        }
        if (error instanceof FlowExitAllException) {
          console.log(`[FlowEngine] ${error.message}`);
          // 传递特殊控制信号，让上层可中止后续流程
          return Promise.resolve(error);
        }
        console.error(`BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`, error);
        return Promise.reject(error);
      }
    }
    return Promise.resolve(stepResults);
  }

  /**
   * Execute all auto-apply flows for model.
   */
  async runAutoFlows(model: FlowModel, inputArgs?: Record<string, any>, useCache = true): Promise<any[]> {
    const autoApplyFlows = model.getAutoFlows();

    if (autoApplyFlows.length === 0) {
      console.warn(`FlowModel: No auto-apply flows found for model '${model.uid}'`);
      return [];
    }

    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(model.getAutoFlowCacheScope(), 'all', model.uid)
      : null;

    if (cacheKey && this.engine) {
      const cachedEntry = this.engine.applyFlowCache.get(cacheKey);
      if (cachedEntry) {
        if (cachedEntry.status === 'resolved') {
          console.log(`[FlowEngine.applyAutoFlows] Using cached result for model: ${model.uid}`);
          return cachedEntry.data;
        }
        if (cachedEntry.status === 'rejected') throw cachedEntry.error;
        if (cachedEntry.status === 'pending') return await cachedEntry.promise;
      }
    }

    const executeAutoFlows = async (): Promise<any[]> => {
      const results: any[] = [];
      const runId = `${model.uid}-autoFlow-${Date.now()}`;
      try {
        await model.beforeApplyAutoFlows(inputArgs);

        if (autoApplyFlows.length === 0) {
          console.warn(`FlowModel: No auto-apply flows found for model '${model.uid}'`);
        } else {
          for (const flow of autoApplyFlows) {
            try {
              const result = await this.runFlow(model, flow.key, inputArgs, runId);
              if (result instanceof FlowExitAllException) {
                console.log(`[FlowEngine.applyAutoFlows] ${result.message}`);
                break; // 终止后续流程执行
              }
              results.push(result);
            } catch (error) {
              console.error(`FlowModel.applyAutoFlows: Error executing auto-apply flow '${flow.key}':`, error);
              throw error;
            }
          }
        }

        await model.afterApplyAutoFlows(results, inputArgs);

        return results;
      } catch (error) {
        if (error instanceof FlowExitException) {
          console.log(`[FlowEngine.applyAutoFlows] ${error.message}`);
          return results;
        }
        try {
          await model.onApplyAutoFlowsError(error as Error, inputArgs);
        } catch (hookError) {
          console.error('FlowModel.applyAutoFlows: Error in onApplyAutoFlowsError hook:', hookError);
        }
        throw error;
      }
    };

    if (!cacheKey || !this.engine) {
      return await executeAutoFlows();
    }

    const promise = executeAutoFlows()
      .then((result) => {
        this.engine.applyFlowCache.set(cacheKey, {
          status: 'resolved',
          data: result,
          promise: Promise.resolve(result),
        } as ApplyFlowCacheEntry);
        return result;
      })
      .catch((err) => {
        this.engine.applyFlowCache.set(cacheKey, {
          status: 'rejected',
          error: err,
          promise: Promise.reject(err),
        } as ApplyFlowCacheEntry);
        throw err;
      });

    this.engine.applyFlowCache.set(cacheKey, { status: 'pending', promise } as ApplyFlowCacheEntry);
    return await promise;
  }

  /**
   * Dispatch an event to flows bound via flow.on and execute them.
   */
  async dispatchEvent(model: FlowModel, eventName: string, inputArgs?: Record<string, any>): Promise<void> {
    const flows = Array.from(model.getFlows().values()).filter((flow) => {
      const on = flow.on;
      if (!on) return false;
      if (typeof on === 'string') return on === eventName;
      if (typeof on === 'object') return on.eventName === eventName;
      return false;
    });
    const runId = `${model.uid}-${eventName}-${Date.now()}`;
    const promises = flows.map((flow) => {
      console.log(`BaseModel '${model.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
      return this.runFlow(model, flow.key, inputArgs, runId).catch((error) => {
        console.error(
          `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`,
          error,
        );
      });
    });
    await Promise.all(promises);
  }
}
