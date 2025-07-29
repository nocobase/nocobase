/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { FlowRuntimeContext, FlowModelContext } from '../flowContext';
import type { FlowModel } from '../models';

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
 * 解析参数中的 {{xxx}} 表达式，自动处理异步属性访问
 */
export async function resolveParamsExpressions<TModel extends FlowModel = FlowModel>(
  params: any,
  ctx: FlowRuntimeContext<TModel>,
): Promise<any> {
  const compile = async (source: any): Promise<any> => {
    if (typeof source === 'string' && /\{\{.*?\}\}/.test(source)) {
      return await compileExpression(source, ctx);
    }

    if (Array.isArray(source)) {
      return Promise.all(source.map(compile));
    }

    if (source && typeof source === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(source)) {
        result[key] = await compile(value);
      }
      return result;
    }

    return source;
  };

  if (ctx.skipResolveParams) {
    return params;
  }

  return compile(params);
}

/**
 * 编译表达式，使用 new Function 但避免 eval，直接访问 ctx 对象
 */
async function compileExpression<TModel extends FlowModel = FlowModel>(
  expression: string,
  ctx: FlowRuntimeContext<TModel>,
): Promise<any> {
  try {
    // 单个表达式直接返回值，保持原始类型
    const singleMatch = expression.match(/^\{\{\s*(ctx\.[^}]+)\s*\}\}$/);
    if (singleMatch) {
      const path = singleMatch[1];

      // 使用 new Function 直接访问 ctx
      const result = await new Function(
        'ctx',
        `
        return (async () => {
          try {
            return await ${path};
          } catch (e) {
            return undefined;
          }
        })();
      `,
      )(ctx);

      if (result !== undefined) {
        return result;
      }

      const fallBackResult = await new Function(
        'ctx',
        `
        return (async () => {
          try {
            return await ${path};
          } catch (e) {
            return undefined;
          }
        })();
      `,
      )(ctx.currentFlow); // TODO: 当currentFlow彻底替换后成新context后这里就不需要了

      return fallBackResult;
    }

    // 多个表达式使用模板字符串，需要预先解析所有值
    let result = expression;
    const matches = [...expression.matchAll(/\{\{\s*(ctx\.[^}]+)\s*\}\}/g)];

    for (const [fullMatch, path] of matches) {
      const value = await new Function(
        'ctx',
        `
        return (async () => {
          try {
            return await ${path};
          } catch (e) {
            return undefined;
          }
        })();
      `,
      )(ctx);

      // 正确处理不同类型的值
      const replacement = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);

      result = result.replace(fullMatch, replacement);
    }

    return result;
  } catch {
    return expression;
  }
}
