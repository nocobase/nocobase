/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRuntimeContext, FlowModelContext } from '../flowContext';
import type { FlowModel } from '../models';
import { compileUiSchema } from './schema-utils';

/**
 * 解析 defaultParams，支持静态值和函数形式
 * @param {Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>)} defaultParams 默认参数
 * @param {FlowRuntimeContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, any>>} 解析后的参数对象
 */
export async function resolveDefaultParams<TModel extends FlowModel = FlowModel>(
  defaultParams: Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>) | undefined,
  ctx: FlowRuntimeContext<TModel>,
): Promise<Record<string, any>> {
  if (!defaultParams) {
    return {};
  }

  if (typeof defaultParams === 'function') {
    try {
      const result = await defaultParams(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultParams function:', error);
      return {};
    }
  }

  return defaultParams;
}

/**
 * 解析 FlowModelMeta 中的 defaultOptions，支持静态值和函数形式
 * @param defaultOptions - 可以是静态对象或返回对象的函数
 * @param ctx - 模型上下文实例，用于传递给函数形式的 defaultOptions
 * @returns 解析后的选项对象
 */
export async function resolveDefaultOptions(
  defaultOptions:
    | Record<string, any>
    | ((ctx: FlowModelContext, extra?: any) => Record<string, any> | Promise<Record<string, any>>)
    | undefined,
  ctx: FlowModelContext,
  extra?: any,
): Promise<Record<string, any>> {
  if (!defaultOptions) {
    return {};
  }

  if (typeof defaultOptions === 'function') {
    try {
      const result = await defaultOptions(ctx, extra);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultOptions function:', error);
      return {};
    }
  }

  return defaultOptions;
}

/**
 * 解析参数中的模板表达式
 * 递归处理对象和数组，将包含 {{xxx}} 形式的字符串替换为实际值
 * @param params - 要解析的参数对象
 * @param ctx - 运行时上下文
 * @returns 解析后的参数对象
 */
export async function resolveTemplateParams<TModel extends FlowModel = FlowModel>(
  params: any,
  ctx: FlowRuntimeContext<TModel>,
): Promise<any> {
  // 如果是 null 或 undefined，直接返回
  if (params == null) {
    return params;
  }

  // 如果是字符串，检查是否包含模板表达式
  if (typeof params === 'string') {
    // 检查是否包含 {{xxx}} 模式
    if (/\{\{.*?\}\}/.test(params)) {
      try {
        // 预先解析所有模板中引用的异步属性
        const resolvedCtx = await resolveAsyncPaths(params, ctx);
        const scope = { ctx: resolvedCtx };

        // 使用 compileUiSchema 来解析模板
        const result = compileUiSchema(scope, params);
        return result;
      } catch (error) {
        console.error('Error resolving template params:', error);
        return params;
      }
    }
    return params;
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(params)) {
    return await Promise.all(params.map((item) => resolveTemplateParams(item, ctx)));
  }

  // 如果是对象，递归处理每个属性
  if (typeof params === 'object') {
    const result: Record<string, any> = {};
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        result[key] = await resolveTemplateParams(params[key], ctx);
      }
    }
    return result;
  }

  return params;
}

/**
 * 预解析模板字符串中引用的所有异步路径
 * @param template - 模板字符串
 * @param ctx - 运行时上下文
 * @returns 包含已解析值的新上下文对象
 */
async function resolveAsyncPaths(template: string, ctx: any): Promise<any> {
  // 提取所有的 ctx.xxx.yyy 路径
  const pathRegex = /ctx\.([a-zA-Z_$][\w$.]*)/g;
  const paths = new Set<string>();
  let match;

  while ((match = pathRegex.exec(template)) !== null) {
    paths.add(match[1]);
  }

  // 创建一个新对象来存储解析后的值
  const resolvedValues: Record<string, any> = {};

  // 解析每个路径
  for (const pathStr of paths) {
    const pathParts = pathStr.split('.');
    try {
      let value = ctx;
      let currentPath = '';

      // 逐级解析路径
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}.${part}` : part;

        if (value && typeof value === 'object' && part in value) {
          value = value[part];

          // 如果是 Promise，等待它
          if (value && typeof value === 'object' && typeof value.then === 'function') {
            try {
              value = await value;
            } catch (error) {
              // 如果 Promise 失败，设置为 undefined
              console.error(`Error resolving async value at ${currentPath}:`, error);
              value = undefined;
              break;
            }
          }

          // 如果值是一个对象且有 get 方法，调用它
          if (value && typeof value === 'object' && typeof value.get === 'function') {
            try {
              value = await value.get();
            } catch (error) {
              console.error(`Error calling get() at ${currentPath}:`, error);
              value = undefined;
              break;
            }
          }
        } else {
          value = undefined;
          break;
        }
      }

      // 将解析后的值存储在对应的路径上
      setNestedValue(resolvedValues, pathParts, value);
    } catch (error) {
      console.error(`Error resolving path ${pathStr}:`, error);
      // 如果路径解析失败，设置为 undefined
      setNestedValue(resolvedValues, pathParts, undefined);
    }
  }

  // 创建一个新的上下文对象，合并原始值和解析后的值
  return mergeContexts(ctx, resolvedValues);
}

/**
 * 在对象中设置嵌套值
 * @param obj - 目标对象
 * @param path - 路径数组
 * @param value - 要设置的值
 */
function setNestedValue(obj: any, path: string[], value: any): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  if (path.length > 0) {
    current[path[path.length - 1]] = value;
  }
}

/**
 * 合并两个上下文对象，优先使用已解析的值
 * @param original - 原始上下文
 * @param resolved - 已解析的值
 * @returns 合并后的上下文
 */
function mergeContexts(original: any, resolved: any): any {
  // 创建一个代理，优先返回已解析的值
  return new Proxy(original, {
    get(target, prop) {
      // 如果在已解析的值中存在，返回已解析的值
      if (prop in resolved) {
        return resolved[prop];
      }
      // 否则返回原始值
      return target[prop];
    },
    has(target, prop) {
      return prop in resolved || prop in target;
    },
    ownKeys(target) {
      const keys = new Set([...Object.keys(target), ...Object.keys(resolved)]);
      return Array.from(keys);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop in resolved) {
        return {
          configurable: true,
          enumerable: true,
          value: resolved[prop],
        };
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    },
  });
}
