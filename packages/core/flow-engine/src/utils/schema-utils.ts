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

const hasFunctionValue = (source: any): boolean => {
  if (typeof source === 'function') return true;
  if (!source || typeof source !== 'object') return false;
  const seen = new WeakSet<object>();
  const walk = (val: any): boolean => {
    if (typeof val === 'function') return true;
    if (!val || typeof val !== 'object') return false;
    if (seen.has(val)) return false;
    seen.add(val);
    if (Array.isArray(val)) {
      for (const it of val) {
        if (walk(it)) return true;
      }
      return false;
    }
    for (const k of Object.keys(val)) {
      if (walk((val as any)[k])) return true;
    }
    return false;
  };
  return walk(source);
};

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
      shouldCompile = hasVariable(cacheKey);
      // schema 中包含函数（如 x-reactions 的闭包）时，缓存会导致跨上下文复用旧闭包，必须禁用缓存
      const hasFn = shouldCompile && !noCache ? hasFunctionValue(source) : false;
      if (compileCache[cacheKey] && !noCache && !hasFn) return compileCache[cacheKey];
      if (hasFn) {
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          console.warn('Failed to compile with Formily Schema.compile:', error);
          return source;
        }
      }
    }

    // source is Array, for example: [{ 'title': "{{ t('Admin') }}", name: 'admin' }, { 'title': "{{ t('Root') }}", name: 'root' }]
    if (Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      shouldCompile = hasVariable(cacheKey);
      const hasFn = shouldCompile && !noCache ? hasFunctionValue(source) : false;
      if (compileCache[cacheKey] && !noCache && !hasFn) return compileCache[cacheKey];
      if (hasFn) {
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          console.warn('Failed to compile with Formily Schema.compile:', error);
          return source;
        }
      }
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
  setupRuntimeContextSteps(flowRuntimeContext, flow.steps, model, flow.key);
  flowRuntimeContext.defineProperty('currentStep', { value: step });

  // 获取步骤的uiSchema
  let stepUiSchema = step.uiSchema;

  if (step.use) {
    try {
      const action = model.getAction?.(step.use);
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

/**
 * 判断步骤在设置菜单中是否应被隐藏。
 * - 支持 StepDefinition.hideInSettings 与 ActionDefinition.hideInSettings（step 优先）。
 * - hideInSettings 可为布尔值或函数（接收 FlowRuntimeContext）。
 */
export async function shouldHideStepInSettings<TModel extends FlowModel = FlowModel>(
  model: TModel,
  flow: any,
  step: StepDefinition,
): Promise<boolean> {
  if (!step) return true;

  // 优先使用 step.hideInSettings，其次回退到 action.hideInSettings
  let hideInSettings = step.hideInSettings;

  if (typeof hideInSettings === 'undefined' && step.use) {
    const action = model.getAction?.(step.use);
    hideInSettings = action?.hideInSettings;
  }

  if (typeof hideInSettings === 'function') {
    try {
      const ctx = new FlowRuntimeContext(model, flow.key, 'settings');
      setupRuntimeContextSteps(ctx, flow.steps, model, flow.key);
      ctx.defineProperty('currentStep', { value: step });
      const result = await hideInSettings(ctx as any);
      return !!result;
    } catch (error) {
      console.warn(`Error evaluating hideInSettings for step '${step.key || ''}' in flow '${flow.key}':`, error);
      return false;
    }
  }

  return !!hideInSettings;
}

/**
 * 解析步骤在设置菜单中的禁用状态与提示文案。
 * - 支持 StepDefinition.disabledInSettings 与 ActionDefinition.disabledInSettings（step 优先）。
 * - 支持 StepDefinition.disabledReasonInSettings 与 ActionDefinition.disabledReasonInSettings（step 优先）。
 * - 以上属性均支持静态值与函数（接收 FlowRuntimeContext）。
 */
export async function resolveStepDisabledInSettings<TModel extends FlowModel = FlowModel>(
  model: TModel,
  flow: any,
  step: StepDefinition,
): Promise<{ disabled: boolean; reason?: string }> {
  if (!step) return { disabled: false };

  let disabledInSettings = step.disabledInSettings;
  let disabledReasonInSettings = step.disabledReasonInSettings;

  if ((typeof disabledInSettings === 'undefined' || typeof disabledReasonInSettings === 'undefined') && step.use) {
    try {
      const action = model.getAction?.(step.use);
      if (typeof disabledInSettings === 'undefined') {
        disabledInSettings = action?.disabledInSettings;
      }
      if (typeof disabledReasonInSettings === 'undefined') {
        disabledReasonInSettings = action?.disabledReasonInSettings;
      }
    } catch (error) {
      console.warn(`Failed to get action ${step.use}:`, error);
    }
  }

  let ctx: FlowRuntimeContext<TModel> | null = null;
  const getContext = () => {
    if (ctx) return ctx;
    ctx = new FlowRuntimeContext(model, flow.key, 'settings');
    setupRuntimeContextSteps(ctx, flow.steps, model, flow.key);
    ctx.defineProperty('currentStep', { value: step });
    return ctx;
  };

  let disabled = false;
  if (typeof disabledInSettings === 'function') {
    try {
      disabled = !!(await disabledInSettings(getContext() as any));
    } catch (error) {
      console.warn(`Error evaluating disabledInSettings for step '${step.key || ''}' in flow '${flow.key}':`, error);
      return { disabled: false };
    }
  } else {
    disabled = !!disabledInSettings;
  }

  if (!disabled) {
    return { disabled: false };
  }

  let reason: string | undefined;
  if (typeof disabledReasonInSettings === 'function') {
    try {
      const resolved = await disabledReasonInSettings(getContext() as any);
      if (typeof resolved !== 'undefined' && resolved !== null && resolved !== '') {
        reason = String(resolved);
      }
    } catch (error) {
      console.warn(
        `Error evaluating disabledReasonInSettings for step '${step.key || ''}' in flow '${flow.key}':`,
        error,
      );
    }
  } else if (
    typeof disabledReasonInSettings !== 'undefined' &&
    disabledReasonInSettings !== null &&
    disabledReasonInSettings !== ''
  ) {
    reason = String(disabledReasonInSettings);
  }

  return { disabled: true, reason };
}
