/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { evaluateConditions, type ConditionEvaluator, type FilterGroupType } from '@nocobase/utils/client';
import { FlowRuntimeContext, type FlowEngineContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import type { FlowModel } from '../models';
import type { FlowEventCondition } from '../types';
import { JSONValue } from './params-resolvers';

export interface EvaluateFlowConditionOptions {
  engine: FlowEngine;
  model: FlowModel;
  flowKey: string;
  condition: FlowEventCondition;
  eventName?: string;
  inputArgs?: Record<string, any>;
  runtimeContext?: FlowRuntimeContext;
}

export async function evaluateFlowCondition({
  engine,
  model,
  flowKey,
  condition,
  eventName,
  inputArgs,
  runtimeContext,
}: EvaluateFlowConditionOptions): Promise<boolean> {
  const ctx = runtimeContext ?? new FlowRuntimeContext(model, flowKey);
  const targetLogger = (ctx as any)?.logger || model.context.logger || engine.logger;

  ctx.defineProperty('inputArgs', {
    value: { ...(inputArgs || {}) },
  });
  ctx.defineProperty('event', {
    value: { name: eventName, args: inputArgs },
  });

  if (typeof condition === 'function') {
    try {
      return await Promise.resolve(condition(ctx));
    } catch (error) {
      targetLogger?.error?.(
        { err: error },
        `FlowEngine: Flow condition function threw error (flow='${flowKey}', event='${eventName}')`,
      );
      return false;
    }
  }

  const clonedCondition: FilterGroupType = _.cloneDeep(condition as FilterGroupType);

  let resolvedCondition: unknown = clonedCondition as unknown as JSONValue;
  try {
    resolvedCondition = await ctx.resolveJsonTemplate(clonedCondition as unknown as JSONValue);
  } catch (error) {
    targetLogger?.warn?.(
      { err: error },
      `FlowEngine: Failed to resolve flow condition template (flow='${flowKey}', event='${eventName}')`,
    );
  }
  const filter = resolvedCondition as FilterGroupType;
  if (!filter || typeof filter !== 'object') return true;
  if (!filter.items || filter.items.length === 0) return true;

  const jsonLogic = getJsonLogic(engine, ctx);
  const evaluator: ConditionEvaluator = ((left: any, operator: string, right: any) => {
    return applyConditionOperator(engine, operator, left, right, jsonLogic);
  }) as ConditionEvaluator;

  try {
    return evaluateConditions(filter, evaluator);
  } catch (error) {
    targetLogger?.error?.(
      { err: error },
      `FlowEngine: Failed to evaluate flow condition (flow='${flowKey}', event='${eventName}')`,
    );
    return false;
  }
}

function getJsonLogic(_engine: FlowEngine, context: FlowRuntimeContext): any | null {
  // 直接从运行态上下文读取 app.jsonLogic，与 linkageRules 的用法保持一致
  return (context as any)?.app?.jsonLogic || null;
}

function applyConditionOperator(engine: FlowEngine, operator: string, left: any, right: any, jsonLogic: any): boolean {
  if (jsonLogic && typeof jsonLogic.apply === 'function') {
    try {
      // 与联动规则一致：统一按两参传入，jsonLogic 的一元运算符会忽略多余参数
      const result = jsonLogic.apply({ [operator]: [left, right] }, { left, right });
      return !!result;
    } catch (error) {
      engine.logger?.warn?.({ err: error }, `FlowEngine: jsonLogic evaluation failed for operator '${operator}'`);
    }
  }
  return false;
}
