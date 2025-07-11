/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRuntimeContext } from '../flowContext';
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
 * @param parentModel - 父模型实例，用于传递给函数形式的 defaultOptions
 * @returns 解析后的选项对象
 */
export async function resolveDefaultOptions(
  defaultOptions:
    | Record<string, any>
    | ((parentModel: FlowModel, extra?: any) => Record<string, any> | Promise<Record<string, any>>)
    | undefined,
  parentModel: FlowModel,
  extra?: any,
): Promise<Record<string, any>> {
  if (!defaultOptions) {
    return {};
  }

  if (typeof defaultOptions === 'function') {
    try {
      const result = await defaultOptions(parentModel, extra);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultOptions function:', error);
      return {};
    }
  }

  return defaultOptions;
}
