/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/json-schema';
import { Schema } from '@formily/json-schema';
import { toJS } from '@formily/reactive';
import type { FlowModel } from '../models';
import { FlowRuntimeContext } from '../flowContext';
import type { StepDefinition, StepUIMode } from '../types';
import { setupRuntimeContextSteps } from './setupRuntimeContextSteps';

/**
 * 解析 uiSchema，支持静态值和函数形式
 * 函数可以接收 FlowRuntimeContext（在 settings 中）
 * @param {Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)} uiSchema UI Schema 定义
 * @param {FlowRuntimeContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, ISchema>>} 解析后的 UI Schema 对象
 */
async function resolveUiSchema<TModel extends FlowModel = FlowModel>(
  uiSchema:
    | Record<string, ISchema>
    | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)
    | undefined,
  ctx: FlowRuntimeContext<TModel>,
): Promise<Record<string, ISchema>> {
  if (!uiSchema) {
    return {};
  }

  if (typeof uiSchema === 'function') {
    try {
      const result = await uiSchema(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving uiSchema function:', error);
      return {};
    }
  }

  return uiSchema;
}

/**
 * 解析 uiMode，支持静态值和函数形式
 * 函数可以接收 FlowRuntimeContext
 * @param {StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)} uiMode UI模式定义
 * @param {FlowRuntimeContext<TModel>} ctx 上下文
 * @returns {Promise<StepUIMode>} 解析后的 UI 模式
 */
export async function resolveUiMode<TModel extends FlowModel = FlowModel>(
  uiMode: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>) | undefined,
  ctx: FlowRuntimeContext<TModel>,
): Promise<StepUIMode> {
  if (!uiMode) {
    return 'dialog';
  }

  if (typeof uiMode === 'function') {
    try {
      const result = await uiMode(ctx);
      return result || 'dialog';
    } catch (error) {
      console.error('Error resolving uiMode function:', error);
      return 'dialog';
    }
  }

  return uiMode;
}

// 模块级全局缓存，与 useCompile 保持一致
const compileCache = {};

/**
 * 编译 UI Schema 中的表达式
 *
 * @param scope 编译作用域，包含可用的变量和函数（如 t, randomString 等）
 * @param uiSchema 待编译的 UI Schema
 * @param options 编译选项
 * @returns 编译后的 UI Schema
 */
export function compileUiSchema(scope: Record<string, any>, uiSchema: any, options: { noCache?: boolean } = {}): any {
  const { noCache = false } = options;

  const hasVariable = (source: string): boolean => {
    const reg = /\{\{.*?\}\}/g;
    return reg.test(source);
  };

  const compile = (source: any): any => {
    let shouldCompile = false;
    let cacheKey: string;

    // source is expression, for example: {{ t('Add new') }}
    if (typeof source === 'string' && source.startsWith('{{')) {
      shouldCompile = true;
      cacheKey = source;
    }

    // source is Component Object, for example: { 'x-component': "Cascader", type: "array", title: "所属地区(行政区划)" }
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    // source is Array, for example: [{ 'title': "{{ t('Admin') }}", name: 'admin' }, { 'title': "{{ t('Root') }}", name: 'root' }]
    if (Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    if (shouldCompile) {
      if (!cacheKey) {
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          console.warn('Failed to compile with Formily Schema.compile:', error);
          return source;
        }
      }
      try {
        if (noCache) {
          return Schema.compile(source, scope);
        }
        compileCache[cacheKey] = compileCache[cacheKey] || Schema.compile(source, scope);
        return compileCache[cacheKey];
      } catch (e) {
        console.log('compileUiSchema error', source, e);
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          return source;
        }
      }
    }

    // source is: plain object、string、number、boolean、undefined、null
    return source;
  };

  return compile(uiSchema);
}

/**
 * 解析并合并步骤的完整uiSchema
 * 这个函数提取了在多个组件中重复使用的uiSchema解析和合并逻辑
 * @param model 模型实例
 * @param flow 流程定义
 * @param step 步骤定义
 * @returns 合并后的uiSchema对象，如果为空则返回null
 */
export async function resolveStepUiSchema<TModel extends FlowModel = FlowModel>(
  model: TModel,
  flow: any,
  step: StepDefinition,
): Promise<Record<string, ISchema> | null> {
  // 创建运行时上下文
  const flowRuntimeContext = new FlowRuntimeContext(model, flow.key, 'settings');
  setupRuntimeContextSteps(flowRuntimeContext, flow, model, flow.key);
  flowRuntimeContext.defineProperty('currentStep', { value: step });

  // 获取步骤的uiSchema
  let stepUiSchema = step.uiSchema;

  if (step.use) {
    try {
      const action = model.flowEngine?.getAction?.(step.use);
      if (action && action.uiSchema) {
        stepUiSchema = stepUiSchema || action.uiSchema;
      }
    } catch (error) {
      console.warn(`Failed to get action ${step.use}:`, error);
    }
  }

  const resolvedStepUiSchema = await resolveUiSchema(stepUiSchema || {}, flowRuntimeContext);

  // 如果解析后没有可配置的UI Schema，返回null
  if (Object.keys(resolvedStepUiSchema).length === 0) {
    return null;
  }

  return resolvedStepUiSchema;
}
