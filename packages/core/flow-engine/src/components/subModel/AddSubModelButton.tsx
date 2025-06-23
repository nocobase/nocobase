/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { FlowModel } from '../../models';
import LazyDropdown, { Item, ItemsType } from './LazyDropdown';
import { ModelConstructor } from '../../types';
import { withFlowDesignMode } from '../common/withFlowDesignMode';

export interface AddSubModelContext {
  model: FlowModel;
  globals: Record<string, any>;
  app?: any;
  extra?: Record<string, any>;
  subModelBaseClass?: ModelConstructor;
}

export type SubModelItemsType =
  | SubModelItem[]
  | ((ctx: AddSubModelContext) => SubModelItem[] | Promise<SubModelItem[]>);

/**
 * 合并多个 SubModelItemsType 的选项
 */
export interface MergeSubModelItemsOptions {
  /**
   * 是否在不同来源之间添加分割线
   */
  addDividers?: boolean;
}

/**
 * 合并多个不同来源的 SubModelItemsType 成一个
 *
 * 支持静态数组和异步函数的混合合并，统一返回异步函数处理所有情况
 *
 * @param sources - 要合并的 SubModelItemsType 数组，支持 undefined 和 null（会被过滤）
 * @param options - 合并选项
 * @returns 合并后的 SubModelItemsType（如果有多个来源则返回异步函数）
 *
 * @example
 * ```typescript
 * const mergedItems = mergeSubModelItems([
 *   fieldItems,           // 字段 items（静态数组）
 *   customItems,          // 自定义 items（静态数组）
 *   async (ctx) => [...], // 动态 items（异步函数）
 *   condition ? extraItems : null, // 条件性 items
 * ], { addDividers: true });
 * ```
 */
export function mergeSubModelItems(
  sources: (SubModelItemsType | undefined | null)[],
  options: MergeSubModelItemsOptions = {},
): SubModelItemsType {
  const { addDividers = false } = options;

  // 过滤掉空值
  const validSources = sources.filter((source): source is SubModelItemsType => source !== undefined && source !== null);

  if (validSources.length === 0) {
    return [];
  }

  if (validSources.length === 1) {
    return validSources[0];
  }

  // 统一返回异步函数处理所有情况
  return async (ctx: AddSubModelContext) => {
    const result: SubModelItem[] = [];

    for (let i = 0; i < validSources.length; i++) {
      const source = validSources[i];
      let items: SubModelItem[] = [];

      if (Array.isArray(source)) {
        items = source;
      } else {
        items = await source(ctx);
      }

      // 添加分割线（除了第一个来源）
      if (i > 0 && addDividers && items.length > 0) {
        result.push({
          key: `divider-${i}`,
          type: 'divider',
        } as SubModelItem);
      }

      result.push(...items);
    }

    return result;
  };
}

export interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  createModelOptions?:
    | { use: string; stepParams?: Record<string, any> }
    | ((item: SubModelItem) => { use: string; stepParams?: Record<string, any> });
  /**
   * 是否在 group 内启用搜索功能（仅对 group 类型有效）
   */
  searchable?: boolean;
  /**
   * 搜索占位符文本（仅对启用搜索的 group 有效）
   */
  searchPlaceholder?: string;
}

interface AddSubModelButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;

  /**
   * 子模型类型列表
   */
  items: SubModelItemsType;

  /**
   * 子模型基类，传递给 context 供 items 函数使用
   */
  subModelBaseClass?: string | ModelConstructor;

  /**
   * 子模型类型：'object' 表示单个子模型，'array' 表示子模型数组
   */
  subModelType?: 'object' | 'array';

  /**
   * 子模型在父模型中的键名
   */
  subModelKey: string;

  /**
   * 创建后的回调函数
   */
  onModelCreated?: (subModel: FlowModel) => Promise<void>;
  /**
   * 添加到父模型后的回调函数
   */
  onSubModelAdded?: (subModel: FlowModel) => Promise<void>;

  /**
   * 按钮文本，默认为 "Add"
   */
  children?: React.ReactNode;
}

/**
 * 验证 createModelOptions 的有效性
 */
const validateCreateModelOptions = (
  createOpts: any,
): createOpts is { use: string; stepParams?: Record<string, any> } => {
  if (!createOpts) {
    console.warn('No createModelOptions found for item');
    return false;
  }

  if (!createOpts.use) {
    console.warn('createModelOptions must specify "use" property:', createOpts);
    return false;
  }

  return true;
};

/**
 * 处理模型创建失败时的清理工作
 */
const handleModelCreationError = async (error: any, addedModel?: FlowModel) => {
  console.error('Failed to add sub model:', error);
  if (addedModel && typeof addedModel.destroy === 'function') {
    try {
      await addedModel.destroy();
    } catch (destroyError) {
      console.error('Failed to destroy model after creation error:', destroyError);
    }
  }
};

/**
 * 递归转换 SubModelItem 数组为 LazyDropdown 的 Item 格式
 */
const transformSubModelItems = (items: SubModelItem[], context: AddSubModelContext): Item[] => {
  return items.map((item) => ({
    ...item,
    children: item.children
      ? typeof item.children === 'function'
        ? async () => {
            const childrenFn = item.children as (ctx: AddSubModelContext) => SubModelItem[] | Promise<SubModelItem[]>;
            const result = await childrenFn(context);
            return transformSubModelItems(result, context);
          }
        : transformSubModelItems(item.children as SubModelItem[], context)
      : undefined,
  }));
};

/**
 * 转换 SubModelItemsType 到 LazyDropdown 的 ItemsType 格式
 */
const transformItems = (items: SubModelItemsType, context: AddSubModelContext): ItemsType => {
  if (typeof items === 'function') {
    return async () => {
      const result = await items(context);
      return transformSubModelItems(result, context);
    };
  }
  return transformSubModelItems(items, context);
};

/**
 * 为 FlowModel 实例添加子模型的通用按钮组件
 *
 * 功能特性：
 * - 支持异步加载 items
 * - 支持多层级嵌套菜单
 * - 支持从 flowEngine 全局上下文获取服务
 *
 */
const AddSubModelButtonCore = function AddSubModelButton({
  model,
  items,
  subModelBaseClass,
  subModelType = 'array',
  subModelKey,
  onModelCreated,
  onSubModelAdded,
  children = 'Add',
}: AddSubModelButtonProps) {
  // 构建上下文对象，从 flowEngine 的全局上下文中获取服务
  const buildContext = useMemo((): AddSubModelContext => {
    const globalContext = model.flowEngine.getContext();
    return {
      model,
      globals: globalContext,
      subModelBaseClass:
        typeof subModelBaseClass === 'string' ? model.flowEngine.getModelClass(subModelBaseClass) : subModelBaseClass,
    };
  }, [model, model.flowEngine, subModelBaseClass]);

  const onClick = async (info: any) => {
    const item = info.originalItem as SubModelItem;
    let createOpts = item.createModelOptions;

    // 如果 createModelOptions 是函数，则调用它获取实际的选项
    if (typeof createOpts === 'function') {
      createOpts = createOpts(item);
    }

    // 验证 createModelOptions 的有效性
    if (!validateCreateModelOptions(createOpts)) {
      return;
    }

    let addedModel: FlowModel | undefined;

    try {
      addedModel = model.flowEngine.createModel({
        ...createOpts,
        subKey: subModelKey,
        subType: subModelType,
      });

      await addedModel.configureRequiredSteps();

      if (onModelCreated) {
        await onModelCreated(addedModel);
      }

      if (subModelType === 'array') {
        model.addSubModel(subModelKey, addedModel);
      } else {
        model.setSubModel(subModelKey, addedModel);
      }

      if (onSubModelAdded) {
        await onSubModelAdded(addedModel);
      }

      await addedModel.save();
    } catch (error) {
      await handleModelCreationError(error, addedModel);
    }
  };

  return <LazyDropdown menu={{ items: transformItems(items, buildContext), onClick }}>{children}</LazyDropdown>;
};

export const AddSubModelButton = withFlowDesignMode(AddSubModelButtonCore);
