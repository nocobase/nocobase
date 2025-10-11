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
import type { DispatchEventOptions } from '../types';
import type { ActionDefinition, ApplyFlowCacheEntry, StepDefinition } from '../types';
import { FlowExitException, resolveDefaultParams } from '../utils';
import { FlowExitAllException } from '../utils/exceptions';
import { setupRuntimeContextSteps } from '../utils/setupRuntimeContextSteps';

export class FlowExecutor {
  constructor(private readonly engine: FlowEngine) {}

  /** Cache wrapper for applyFlow cache lifecycle */
  private async withApplyFlowCache<T>(cacheKey: string | null, executor: () => Promise<T>): Promise<T> {
    if (!cacheKey || !this.engine) return await executor();

    const cachedEntry = this.engine.applyFlowCache.get(cacheKey);
    if (cachedEntry) {
      if (cachedEntry.status === 'resolved') return cachedEntry.data as T;
      if (cachedEntry.status === 'rejected') throw cachedEntry.error;
      if (cachedEntry.status === 'pending') return await cachedEntry.promise;
    }

    const promise = executor()
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
   * Execute a single flow on model.
   */
  async runFlow(model: FlowModel, flowKey: string, inputArgs?: Record<string, any>, runId?: string): Promise<any> {
    const flow = model.getFlow(flowKey);

    if (!flow) {
      model.context.logger.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    const flowContext = new FlowRuntimeContext(model, flowKey);

    flowContext.defineProperty('reactView', {
      value: model.reactView,
    });
    flowContext.defineProperty('inputArgs', {
      value: {
        ...inputArgs,
      },
    });
    flowContext.defineProperty('runId', {
      value: runId || `run-${Date.now()}`,
    });

    let lastResult: any;
    const stepResults: Record<string, any> = flowContext.stepResults;

    // Build steps with optional eventStep injection (when flow.on is configured)
    let eventStep = model.getEvent(typeof flow.on === 'string' ? flow.on : (flow.on as any)?.eventName);
    if (eventStep) {
      eventStep = { ...eventStep } as any; // clone to avoid side effects
      (eventStep as any).defaultParams = {
        ..._.get(flow, 'on.defaultParams', {}),
        ...(eventStep as any).defaultParams,
      };
    }
    const stepDefs: Record<string, StepDefinition> = eventStep
      ? { eventStep: eventStep as any, ...flow.steps }
      : flow.steps;

    // Setup steps meta and runtime mapping
    setupRuntimeContextSteps(flowContext, stepDefs, model, flowKey);
    const stepsRuntime = flowContext.steps as Record<string, { params: any; uiSchema?: any; result?: any }>;

    for (const [stepKey, step] of Object.entries(stepDefs) as [string, StepDefinition][]) {
      // Resolve handler and params
      let handler: ActionDefinition['handler'] | undefined;
      let combinedParams: Record<string, any> = {};
      let useRawParams: StepDefinition['useRawParams'] = step.useRawParams;
      if (step.use) {
        const actionDefinition = model.getAction(step.use);
        if (!actionDefinition) {
          flowContext.logger.error(
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
        flowContext.logger.error(
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
        combinedParams = await flowContext.resolveJsonTemplate(combinedParams);
      }
      try {
        if (!handler) {
          flowContext.logger.error(
            `BaseModel.applyFlow: No handler available for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
          );
          continue;
        }
        const currentStepResult = handler(flowContext, combinedParams);
        const isAwait = step.isAwait !== false;
        lastResult = isAwait ? await currentStepResult : currentStepResult;

        // Store step result and update context
        stepResults[stepKey] = lastResult;
        stepsRuntime[stepKey].result = stepResults[stepKey];
      } catch (error) {
        if (error instanceof FlowExitException) {
          flowContext.logger.info(`[FlowEngine] ${error.message}`);
          return Promise.resolve(stepResults);
        }
        if (error instanceof FlowExitAllException) {
          flowContext.logger.info(`[FlowEngine] ${error.message}`);
          return Promise.resolve(error);
        }
        flowContext.logger.error(
          { err: error },
          `BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`,
        );
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
      model.context.logger.warn(`FlowModel: No auto-apply flows found for model '${model.uid}'`);
      return [];
    }

    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(model.getAutoFlowCacheScope(), 'all', model.uid)
      : null;

    if (cacheKey && this.engine) {
      const cachedEntry = this.engine.applyFlowCache.get(cacheKey);
      if (cachedEntry) {
        if (cachedEntry.status === 'resolved') {
          model.context.logger.debug(`[FlowEngine.applyAutoFlows] Using cached result for model: ${model.uid}`);
          return cachedEntry.data;
        }
        if (cachedEntry.status === 'rejected') throw cachedEntry.error;
        if (cachedEntry.status === 'pending') return await cachedEntry.promise;
      }
    }

    const executeAutoFlows = async (): Promise<any[]> => {
      const results: any[] = [];
      const runId = `${model.uid}-autoFlow-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const logger = model.context.logger.child({ module: 'flow-engine', component: 'FlowExecutor', runId });
      logger.debug(
        `[FlowExecutor] runAutoFlows: uid=${model.uid}, isFork=${
          (model as any)?.isFork === true
        }, useCache=${useCache}, runId=${runId}, flows=${autoApplyFlows.map((f) => f.key).join(',')}`,
      );
      try {
        if (autoApplyFlows.length === 0) {
          logger.warn(`FlowModel: No auto-apply flows found for model '${model.uid}'`);
        } else {
          for (const flow of autoApplyFlows) {
            try {
              logger.debug(`[FlowExecutor] runFlow: uid=${model.uid}, flowKey=${flow.key}`);
              const result = await this.runFlow(model, flow.key, inputArgs, runId);
              if (result instanceof FlowExitAllException) {
                logger.debug(`[FlowEngine.applyAutoFlows] ${result.message}`);
                break; // 终止后续流程执行
              }
              results.push(result);
            } catch (error) {
              logger.error({ err: error }, `FlowModel.applyAutoFlows: Error executing auto-apply flow '${flow.key}':`);
              throw error;
            }
          }
        }
        return results;
      } catch (error) {
        if (error instanceof FlowExitException) {
          logger.debug(`[FlowEngine.applyAutoFlows] ${error.message}`);
          return results;
        }
        throw error;
      }
    };

    return await this.withApplyFlowCache(cacheKey, executeAutoFlows);
  }

  /**
   * Dispatch an event to flows bound via flow.on and execute them.
   */
  async dispatchEvent(
    model: FlowModel,
    eventName: string,
    inputArgs?: Record<string, any>,
    options?: DispatchEventOptions,
  ): Promise<void> {
    // 统一 beforeRender：直接复用自动流执行逻辑（顺序 + 缓存 + 退出控制）。
    if (eventName === 'beforeRender') {
      try {
        // 走模型层以触发 onBefore/After/OnError 钩子，并复用缓存
        await model.applyAutoFlows(inputArgs, true);
      } catch (error) {
        // 与事件分发语义保持一致：记录错误，不中断调用方
        model.context.logger.error(
          { err: error },
          `BaseModel.dispatchEvent: Error executing beforeRender auto flows for model '${model.uid}':`,
        );
      }
      return;
    }

    const flows = Array.from(model.getFlows().values()).filter((flow) => {
      const on = flow.on;
      if (!on) return false;
      if (typeof on === 'string') return on === eventName;
      if (typeof on === 'object') return on.eventName === eventName;
      return false;
    });
    const runId = `${model.uid}-${eventName}-${Date.now()}`;
    const logger = model.context.logger;

    // 顺序/并行两种策略（默认并行）
    if (options?.sequential) {
      // 按 sort 升序串行执行
      const ordered = flows.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      for (const flow of ordered) {
        try {
          logger.debug(`BaseModel '${model.uid}' dispatching event '${eventName}' to flow '${flow.key}' (sequential).`);
          const result = await this.runFlow(model, flow.key, inputArgs, runId);
          if (result instanceof FlowExitAllException) {
            logger.debug(`[FlowEngine.dispatchEvent] ${result.message}`);
            break; // 顺序模式下，允许 exitAll 终止后续执行
          }
        } catch (error) {
          logger.error(
            { err: error },
            `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}' (sequential):`,
          );
          // 不中断其它 flow，继续执行
        }
      }
      return;
    }

    // 默认并行执行
    const promises = flows.map((flow) => {
      logger.debug(`BaseModel '${model.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
      return this.runFlow(model, flow.key, inputArgs, runId).catch((error) => {
        logger.error(
          { err: error },
          `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`,
        );
      });
    });
    await Promise.all(promises);
  }
}
