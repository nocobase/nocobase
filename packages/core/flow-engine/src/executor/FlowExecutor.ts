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

  // runAutoFlows 已移除：统一通过 dispatchEvent('beforeRender') + useCache 控制

  /**
   * Dispatch an event to flows bound via flow.on and execute them.
   */
  async dispatchEvent(
    model: FlowModel,
    eventName: string,
    inputArgs?: Record<string, any>,
    options?: DispatchEventOptions,
  ): Promise<any> {
    const isBeforeRender = eventName === 'beforeRender';
    const sequential = isBeforeRender || !!options?.sequential;
    const useCache = isBeforeRender || !!options?.useCache;

    const runId = `${model.uid}-${eventName}-${Date.now()}`;
    const logger = model.context.logger;

    // 构造待执行的 flows 列表
    const flows = isBeforeRender
      ? model.getEventFlows('beforeRender') // 统一：beforeRender 运行自动流集合（含无 on 的流）
      : Array.from(model.getFlows().values()).filter((flow) => {
          const on = flow.on;
          if (!on) return false;
          if (typeof on === 'string') return on === eventName;
          if (typeof on === 'object') return on.eventName === eventName;
          return false;
        });

    // 组装执行函数（返回值用于缓存；beforeRender 返回 results:any[]，其它返回 true）
    const execute = async () => {
      if (sequential) {
        const ordered = flows.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        const results: any[] = [];
        for (const flow of ordered) {
          try {
            logger.debug(
              `BaseModel '${model.uid}' dispatching event '${eventName}' to flow '${flow.key}' (sequential).`,
            );
            const result = await this.runFlow(model, flow.key, inputArgs, runId);
            if (result instanceof FlowExitAllException) {
              logger.debug(`[FlowEngine.dispatchEvent] ${result.message}`);
              break; // 终止后续
            }
            if (isBeforeRender) results.push(result);
          } catch (error) {
            logger.error(
              { err: error },
              `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}' (sequential):`,
            );
            // 顺序模式不中断其它 flow
          }
        }
        return isBeforeRender ? results : true;
      }

      // 并行
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
      return isBeforeRender ? [] : true;
    };

    // 缓存键：beforeRender 与自动流共用同一键；其它事件按 event + scope 缓存（默认关闭）
    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(
          `event:${model.getAutoFlowCacheScope()}`,
          isBeforeRender ? 'beforeRender' : eventName,
          model.uid,
        )
      : null;

    try {
      return await this.withApplyFlowCache(cacheKey, execute);
    } catch (error) {
      // 与事件分发语义保持一致：记录错误，不抛给调用方
      model.context.logger.error(
        { err: error },
        `BaseModel.dispatchEvent: Error executing event '${eventName}' for model '${model.uid}':`,
      );
    }
  }
}
