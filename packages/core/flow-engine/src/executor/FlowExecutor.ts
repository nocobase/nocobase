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
import { levelByDuration, serializeError, startTimer, logAt } from '../utils/logging';
import {
  logStepStart,
  logStepEnd,
  logStepError,
  logEventStart,
  logEventEnd,
  logEventFlowDispatch,
  logEventFlowError,
} from '../utils/logHelpers';

export class FlowExecutor {
  constructor(private readonly engine: FlowEngine) {}

  /** Cache wrapper for applyFlow cache lifecycle */
  private async withApplyFlowCache<T>(cacheKey: string | null, executor: () => Promise<T>): Promise<T> {
    if (!cacheKey) return await executor();

    const logger = this.engine.context.logger;
    const cachedEntry = this.engine.applyFlowCache.get(cacheKey);
    if (cachedEntry) {
      logger.debug({ type: 'cache.hit', key: cacheKey, status: cachedEntry.status });
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
        logger.debug({ type: 'cache.set.resolved', key: cacheKey });
        return result;
      })
      .catch((err) => {
        this.engine.applyFlowCache.set(cacheKey, {
          status: 'rejected',
          error: err,
          promise: Promise.reject(err),
        } as ApplyFlowCacheEntry);
        logger.debug({ type: 'cache.set.rejected', key: cacheKey });
        throw err;
      });

    this.engine.applyFlowCache.set(cacheKey, { status: 'pending', promise } as ApplyFlowCacheEntry);
    logger.debug({ type: 'cache.set.pending', key: cacheKey });
    return await promise;
  }

  /**
   * Execute a single flow on model.
   */
  async runFlow(model: FlowModel, flowKey: string, inputArgs?: Record<string, any>, runId?: string): Promise<any> {
    const flow = model.getFlow(flowKey);

    if (!flow) {
      model.context.logger.error(
        { type: 'flow.error', flowKey, modelId: model.uid, modelType: model.constructor.name },
        `BaseModel.applyFlow: Flow with key '${flowKey}' not found.`,
      );
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

    // flow start log
    const flowLogger = model.context.logger.child({
      modelId: model.uid,
      modelType: model.constructor.name,
      flowKey,
      runId,
    });
    const flowTimer = startTimer();
    const flowStartData = {
      type: 'flow.start',
      modelId: model.uid,
      modelType: model.constructor.name,
      flowKey,
      runId,
      steps: Object.keys(stepDefs || {}).length,
    };
    flowLogger.debug(flowStartData);

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
        const actionParamsTimer = startTimer();
        const actionDefaultParams = await resolveDefaultParams(actionDefinition.defaultParams, flowContext);
        const actionParamsMs = actionParamsTimer();
        if (actionParamsMs > this.engine.logManager.options.slowParamsMs) {
          const stepType = step.use || 'inline';
          // 避免在循环内创建 child logger：直接附加上下文字段
          flowLogger.debug({
            type: 'step.params.resolve',
            scope: 'action',
            duration: actionParamsMs,
            stepKey,
            stepType,
          });
        }
        const stepParamsTimer = startTimer();
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
        const stepParamsMs = stepParamsTimer();
        if (stepParamsMs > this.engine.logManager.options.slowParamsMs) {
          const stepType = step.use || 'inline';
          // 避免在循环内创建 child logger：直接附加上下文字段
          flowLogger.debug({
            type: 'step.params.resolve',
            scope: 'step',
            duration: stepParamsMs,
            stepKey,
            stepType,
          });
        }
        combinedParams = { ...actionDefaultParams, ...stepDefaultParams };
      } else if (step.handler) {
        handler = step.handler;
        const stepParamsTimer = startTimer();
        const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
        const stepParamsMs = stepParamsTimer();
        if (stepParamsMs > this.engine.logManager.options.slowParamsMs) {
          const stepType = step.use || 'inline';
          // 避免在循环内创建 child logger：直接附加上下文字段
          flowLogger.debug({ type: 'step.params.resolve', scope: 'step', duration: stepParamsMs, stepKey, stepType });
        }
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
          const stepType = step.use || 'inline';
          const msg = `BaseModel.applyFlow: No handler available for step '${stepKey}' in flow '${flowKey}'.`;
          flowContext.logger.info(
            {
              type: 'step.missingHandler',
              stepKey,
              flowKey,
              modelId: model.uid,
              modelType: model.constructor.name,
              stepType,
            },
            msg,
          );
          continue; // skip step handler
        }
        const stepType = step.use || 'inline';
        const stepTimer = startTimer();
        logStepStart(flowLogger, {
          modelId: model.uid,
          modelType: model.constructor.name,
          flowKey,
          runId,
          stepKey,
          stepType,
        });
        const currentStepResult = handler(flowContext, combinedParams);
        const isAwait = step.isAwait !== false;
        lastResult = isAwait ? await currentStepResult : currentStepResult;

        // Store step result and update context
        stepResults[stepKey] = lastResult;
        stepsRuntime[stepKey].result = stepResults[stepKey];
        // step end log with duration
        const stepDuration = stepTimer();
        logStepEnd(
          flowLogger,
          {
            modelId: model.uid,
            modelType: model.constructor.name,
            flowKey,
            runId,
            stepKey,
            stepType,
            duration: stepDuration,
          },
          this.engine.logManager.options.slowStepMs,
        );
      } catch (error) {
        if (error instanceof FlowExitException) {
          flowContext.logger.info(
            { type: 'flow.exit', flowKey, modelId: model.uid, modelType: model.constructor.name },
            `[FlowEngine] ${error.message}`,
          );
          return Promise.resolve(stepResults);
        }
        if (error instanceof FlowExitAllException) {
          flowContext.logger.info(
            { type: 'flow.exitAll', flowKey, modelId: model.uid, modelType: model.constructor.name },
            `[FlowEngine] ${error.message}`,
          );
          return Promise.resolve(error);
        }
        const stepType = step.use || 'inline';
        // 避免每步创建 child logger：直接携带上下文字段
        logStepError(
          flowLogger,
          {
            modelId: model.uid,
            modelType: model.constructor.name,
            flowKey,
            runId,
            stepKey,
            stepType,
          },
          error,
        );
        return Promise.reject(error);
      }
    }
    // flow end log
    const flowDuration = flowTimer();
    const flowLevel = levelByDuration(flowDuration, this.engine.logManager.options.slowEventMs);
    const flowEnd = {
      type: 'flow.end',
      modelId: model.uid,
      modelType: model.constructor.name,
      flowKey,
      runId,
      duration: flowDuration,
      status: 'ok',
    };
    logAt(flowLogger, flowLevel, flowEnd);
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
    const logger = model.context.logger.child({
      modelId: model.uid,
      modelType: model.constructor.name,
      eventName,
      runId,
    });
    const eventTimer = startTimer();
    // flows will be computed below; delay event.start until we know count

    try {
      await model.onDispatchEventStart?.(eventName, options, inputArgs);
    } catch (err) {
      if (isBeforeRender && err instanceof FlowExitException) {
        logger.debug({ type: 'event.exit', message: err.message });
        return [];
      }
      // 进入错误钩子并记录
      try {
        await model.onDispatchEventError?.(eventName, options, inputArgs, err as Error);
      } finally {
        logger.error(
          { type: 'event.hook.start.error', error: serializeError(err) },
          `BaseModel.dispatchEvent: Start hook error for event '${eventName}'`,
        );
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

    // 组装执行函数（返回值用于缓存；beforeRender 返回 results:any[]，其它返回 true）
    // Emit event.start with flows count
    logEventStart(logger, {
      modelId: model.uid,
      modelType: model.constructor.name,
      eventName,
      runId,
      flowsCount: flows.length,
      options: { sequential, useCache },
    });
    const execute = async () => {
      if (sequential) {
        const ordered = flows.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
        const results: any[] = [];
        for (const flow of ordered) {
          try {
            logEventFlowDispatch(logger, {
              modelId: model.uid,
              modelType: model.constructor.name,
              eventName,
              runId,
              flowKey: flow.key,
              mode: 'sequential',
            });
            const result = await this.runFlow(model, flow.key, inputArgs, runId);
            if (result instanceof FlowExitAllException) {
              logger.debug({ type: 'event.exitAll', message: result.message });
              break; // 终止后续
            }
            results.push(result);
          } catch (error) {
            logEventFlowError(logger, {
              modelId: model.uid,
              modelType: model.constructor.name,
              eventName,
              runId,
              flowKey: flow.key,
              error,
            });
            throw error;
          }
        }
        return results;
      }

      // 并行
      const results = await Promise.all(
        flows.map(async (flow) => {
          logEventFlowDispatch(logger, {
            modelId: model.uid,
            modelType: model.constructor.name,
            eventName,
            runId,
            flowKey: flow.key,
            mode: 'parallel',
          });
          try {
            return await this.runFlow(model, flow.key, inputArgs, runId);
          } catch (error) {
            logEventFlowError(logger, {
              modelId: model.uid,
              modelType: model.constructor.name,
              eventName,
              runId,
              flowKey: flow.key,
              error,
            });
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
        logger.error(
          { type: 'event.hook.end.error', error: serializeError(hookErr) },
          `BaseModel.dispatchEvent: End hook error for event '${eventName}'`,
        );
      }
      // event end log
      const d = eventTimer();
      const resultsCount = Array.isArray(result) ? result.length : result ? 1 : 0;
      logEventEnd(
        logger,
        { modelId: model.uid, modelType: model.constructor.name, eventName, runId, duration: d, resultsCount },
        this.engine.logManager.options.slowEventMs,
      );
      return result;
    } catch (error) {
      // 进入错误钩子并记录
      try {
        await model.onDispatchEventError?.(eventName, options, inputArgs, error as Error);
      } catch (hookError) {
        const hookErrLog = {
          type: 'event.hook.error.error',
          modelId: model.uid,
          modelType: model.constructor.name,
          eventName,
          runId,
          error: serializeError(hookError),
        };
        logger.error(hookErrLog, `BaseModel.dispatchEvent: Error hook threw for event '${eventName}'`);
      }
      const evErr = {
        type: 'event.dispatch.error',
        modelId: model.uid,
        modelType: model.constructor.name,
        eventName,
        runId,
        error: serializeError(error),
      };
      logger.error(evErr, `BaseModel.dispatchEvent: Error executing event '${eventName}' for model '${model.uid}':`);
      if (throwOnError) throw error;
    }
  }
}
