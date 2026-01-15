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
import { createEphemeralContext } from '../utils/createEphemeralContext';

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
      let handler: ActionDefinition<FlowModel, FlowRuntimeContext>['handler'] | undefined;
      let combinedParams: Record<string, any> = {};
      let useRawParams: StepDefinition['useRawParams'] = step.useRawParams;
      let runtimeCtx: FlowRuntimeContext;
      if (step.use) {
        const actionDefinition = model.getAction(step.use);
        if (!actionDefinition) {
          flowContext.logger.error(
            `BaseModel.applyFlow: Action '${step.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
          );
          continue;
        }

        // 为当前 step 创建“临时上下文”，并直接注入 action 与 step 提供的定义（step 覆盖 action）
        runtimeCtx = await createEphemeralContext<FlowRuntimeContext>(flowContext, {
          ...actionDefinition,
          ...step,
        });

        handler = step.handler || actionDefinition.handler;
        useRawParams = useRawParams ?? actionDefinition.useRawParams;
        const actionDefaultParams = await resolveDefaultParams(actionDefinition.defaultParams, runtimeCtx);
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, runtimeCtx);
        combinedParams = { ...actionDefaultParams, ...stepDefaultParams };
      } else if (step.handler) {
        // 对于内联 handler，为该步创建临时上下文并注入 step 定义
        runtimeCtx = await createEphemeralContext<FlowRuntimeContext>(flowContext, step);
        handler = step.handler;
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, runtimeCtx);
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
        useRawParams = await useRawParams(runtimeCtx);
      }
      if (!useRawParams) {
        combinedParams = await runtimeCtx.resolveJsonTemplate(combinedParams);
      }
      try {
        if (!handler) {
          flowContext.logger.error(
            `BaseModel.applyFlow: No handler available for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
          );
          continue;
        }
        const currentStepResult = handler(runtimeCtx, combinedParams);
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
    // 由模型层决定缺省值；执行器仅按显式 options 执行
    const sequential = !!options?.sequential;
    const useCache = !!options?.useCache;
    // beforeRender 特殊处理：出错时一律抛出（用于错误边界捕获）
    const throwOnError = isBeforeRender;

    const runId = `${model.uid}-${eventName}-${Date.now()}`;
    const logger = model.context.logger;

    try {
      await this.engine.emitter.emitAsync(`model:event:${eventName}:start`, {
        uid: model.uid,
        model,
        runId,
        inputArgs,
      });
      await model.onDispatchEventStart?.(eventName, options, inputArgs);
    } catch (err) {
      if (isBeforeRender && err instanceof FlowExitException) {
        logger.debug(`[FlowModel.dispatchEvent] ${err.message}`);
        return [];
      }
      // 进入错误钩子并记录
      try {
        await model.onDispatchEventError?.(eventName, options, inputArgs, err as Error);
      } finally {
        logger.error({ err }, `BaseModel.dispatchEvent: Start hook error for event '${eventName}'`);
      }
      if (throwOnError) throw err;
      return;
    }

    // 构造待执行的 flows 列表
    const flows = isBeforeRender
      ? model.getEventFlows('beforeRender') // beforeRender 事件集合（兼容未声明 on 且非 manual 的定义）
      : Array.from(model.getFlows().values()).filter((flow) => {
          const on = flow.on;
          if (!on) return false;
          if (typeof on === 'string') return on === eventName;
          if (typeof on === 'object') return on.eventName === eventName;
          return false;
        });

    // 路由系统的“重放打开视图”会再次 dispatchEvent('click')，但这不应重复触发用户配置的动态事件流。
    // 约定：由路由重放触发时，会在 inputArgs 中携带 triggerByRouter: true
    const isRouterReplayClick = eventName === 'click' && inputArgs?.triggerByRouter === true;
    const flowsToRun = isRouterReplayClick
      ? flows.filter((flow) => {
          const reg = flow['flowRegistry'] as any;
          const type = reg?.constructor?._type as 'instance' | 'global' | undefined;
          return type !== 'instance';
        })
      : flows;

    // 组装执行函数（返回值用于缓存；beforeRender 返回 results:any[]，其它返回 true）
    const execute = async () => {
      if (sequential) {
        // 顺序执行：动态流（实例级）优先，其次静态流；各自组内再按 sort 升序，最后保持原始顺序稳定
        const flowsWithIndex = flowsToRun.map((f, i) => ({ f, i }));
        const ordered = flowsWithIndex
          .slice()
          .sort((a, b) => {
            const regA = a.f['flowRegistry'] as any;
            const regB = b.f['flowRegistry'] as any;
            const typeA = regA?.constructor?._type as 'instance' | 'global' | undefined;
            const typeB = regB?.constructor?._type as 'instance' | 'global' | undefined;
            const groupA = typeA === 'instance' ? 0 : 1; // 实例=0，静态=1
            const groupB = typeB === 'instance' ? 0 : 1;
            if (groupA !== groupB) return groupA - groupB;
            const sa = a.f.sort ?? 0;
            const sb = b.f.sort ?? 0;
            if (sa !== sb) return sa - sb;
            return a.i - b.i; // 稳定排序：保持原有相对顺序
          })
          .map((x) => x.f);
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
            results.push(result);
          } catch (error) {
            logger.error(
              { err: error },
              `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}' (sequential):`,
            );
            throw error;
          }
        }
        return results;
      }

      // 并行
      const results = await Promise.all(
        flowsToRun.map(async (flow) => {
          logger.debug(`BaseModel '${model.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
          try {
            return await this.runFlow(model, flow.key, inputArgs, runId);
          } catch (error) {
            logger.error(
              { err: error },
              `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`,
            );
            if (throwOnError) throw error;
            return undefined;
          }
        }),
      );
      return results.filter((x) => x !== undefined);
    };

    // 缓存键：按事件+scope 统一管理（beforeRender 也使用事件名 beforeRender）
    const argsKey = useCache ? JSON.stringify(inputArgs ?? {}) : '';
    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(
          `event:${model.getFlowCacheScope(eventName)}:${argsKey}`,
          eventName,
          model.uid,
        )
      : null;

    try {
      const result = await this.withApplyFlowCache(cacheKey, execute);
      // 事件结束钩子
      try {
        await model.onDispatchEventEnd?.(eventName, options, inputArgs, result);
      } catch (hookErr) {
        logger.error({ err: hookErr }, `BaseModel.dispatchEvent: End hook error for event '${eventName}'`);
      }
      await this.engine.emitter.emitAsync(`model:event:${eventName}:end`, {
        uid: model.uid,
        model,
        runId,
        inputArgs,
        result,
      });
      return result;
    } catch (error) {
      // 进入错误钩子并记录
      try {
        await model.onDispatchEventError?.(eventName, options, inputArgs, error as Error);
      } catch (_) {
        // swallow secondary hook error
      }
      model.context.logger.error(
        { err: error },
        `BaseModel.dispatchEvent: Error executing event '${eventName}' for model '${model.uid}':`,
      );
      await this.engine.emitter.emitAsync(`model:event:${eventName}:error`, {
        uid: model.uid,
        model,
        runId,
        inputArgs,
        error,
      });
      if (throwOnError) throw error;
    }
  }
}
