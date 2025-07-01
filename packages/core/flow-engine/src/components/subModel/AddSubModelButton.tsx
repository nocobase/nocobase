/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Switch } from 'antd';
import { FlowModel } from '../../models';
import { ModelConstructor } from '../../types';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import LazyDropdown, { Item, ItemsType } from './LazyDropdown';
import _ from 'lodash';

// ============================================================================
// 类型定义
// ============================================================================

export interface AddSubModelContext {
  model: FlowModel;
  globals: Record<string, any>;
  app?: any;
  extra?: Record<string, any>;
  subModelBaseClass?: ModelConstructor;
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
  searchable?: boolean;
  searchPlaceholder?: string;
  keepDropdownOpen?: boolean;
  toggleDetector?: (ctx: AddSubModelContext) => boolean | Promise<boolean>;
  removeModelOptions?: {
    customRemove?: (ctx: AddSubModelContext, item: SubModelItem) => Promise<void>;
  };
}

export type SubModelItemsType =
  | SubModelItem[]
  | ((ctx: AddSubModelContext) => SubModelItem[] | Promise<SubModelItem[]>);

export interface MergeSubModelItemsOptions {
  addDividers?: boolean;
}

interface AddSubModelButtonProps {
  model: FlowModel;
  items: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelType?: 'object' | 'array';
  subModelKey: string;
  onModelCreated?: (subModel: FlowModel) => Promise<void>;
  onSubModelAdded?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}

// ============================================================================
// 工具函数
// ============================================================================

// 预定义样式对象，避免重复创建
const SWITCH_CONTAINER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '0 4px',
} as const;

const SWITCH_STYLE = {
  pointerEvents: 'none' as const,
};

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
 * 安全地获取菜单项的创建选项
 */
const getCreateModelOptions = (item: SubModelItem) => {
  let createOpts = item.createModelOptions;
  if (typeof createOpts === 'function') {
    createOpts = createOpts(item);
  }
  return createOpts;
};

/**
 * 创建构建上下文的工厂函数
 */
const createBuildContext = (model: FlowModel, subModelBaseClass?: string | ModelConstructor): AddSubModelContext => {
  const globalContext = model.flowEngine.getContext();
  return {
    model,
    globals: globalContext,
    subModelBaseClass:
      typeof subModelBaseClass === 'string' ? model.flowEngine.getModelClass(subModelBaseClass) : subModelBaseClass,
  };
};

/**
 * 合并多个不同来源的 SubModelItemsType 成一个
 */
export function mergeSubModelItems(
  sources: (SubModelItemsType | undefined | null)[],
  options: MergeSubModelItemsOptions = {},
): SubModelItemsType {
  const { addDividers = false } = options;
  const validSources = sources.filter((source): source is SubModelItemsType => source !== undefined && source !== null);

  if (validSources.length === 0) return [];
  if (validSources.length === 1) return validSources[0];

  return async (ctx: AddSubModelContext) => {
    const result: SubModelItem[] = [];
    for (let i = 0; i < validSources.length; i++) {
      const source = validSources[i];
      const items: SubModelItem[] = Array.isArray(source) ? source : await source(ctx);

      if (i > 0 && addDividers && items.length > 0) {
        result.push({ key: `divider-${i}`, type: 'divider' } as SubModelItem);
      }
      result.push(...items);
    }
    return result;
  };
}

// ============================================================================
// 转换器函数
// ============================================================================

/**
 * 创建 Switch 标签的工厂函数
 */
const createSwitchLabel = (originalLabel: string, isToggled: boolean) => (
  <div style={SWITCH_CONTAINER_STYLE}>
    <span>{originalLabel}</span>
    <Switch size="small" checked={isToggled} style={SWITCH_STYLE} />
  </div>
);

/**
 * 检查是否包含可切换项
 */
const hasToggleItems = (items: SubModelItem[]): boolean => {
  return items.some((item) => item.toggleDetector && !item.children);
};

/**
 * 递归转换 SubModelItem 数组为 LazyDropdown 的 Item 格式
 */
const transformSubModelItems = async (items: SubModelItem[], context: AddSubModelContext): Promise<Item[]> => {
  if (items.length === 0) return [];

  // 批量收集需要异步检测的可切换项
  const toggleItems: Array<{ item: SubModelItem; index: number }> = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.toggleDetector && !item.children) {
      toggleItems.push({ item, index: i });
    }
  }

  // 批量执行 toggleDetector
  const toggleResults = await Promise.allSettled(toggleItems.map(({ item }) => item.toggleDetector!(context)));

  const toggleMap = new Map<number, boolean>();
  toggleItems.forEach(({ index }, i) => {
    const result = toggleResults[i];
    toggleMap.set(index, result.status === 'fulfilled' ? result.value : false);
  });

  // 并发转换所有项目
  const transformPromises = items.map(async (item, index) => {
    const transformedItem: Item = {
      key: item.key,
      label: item.label,
      type: item.type,
      disabled: item.disabled,
      icon: item.icon,
      searchable: item.searchable,
      searchPlaceholder: item.searchPlaceholder,
      keepDropdownOpen: item.keepDropdownOpen,
      originalItem: item,
    };

    // 处理 children
    if (item.children) {
      if (typeof item.children === 'function') {
        transformedItem.children = async () => {
          const childrenFn = item.children as (ctx: AddSubModelContext) => SubModelItem[] | Promise<SubModelItem[]>;
          const childrenResult = await childrenFn(context);
          return transformSubModelItems(childrenResult, context);
        };
      } else {
        transformedItem.children = await transformSubModelItems(item.children as SubModelItem[], context);
      }
    }

    // 处理开关式菜单项
    if (item.toggleDetector && !item.children) {
      const isToggled = toggleMap.get(index) || false;
      const originalLabel = item.label || '';
      transformedItem.label = createSwitchLabel(originalLabel, isToggled);
      transformedItem.isToggled = isToggled;
    }

    return transformedItem;
  });

  return Promise.all(transformPromises);
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

  const hasToggle = hasToggleItems(items as SubModelItem[]);
  if (hasToggle) {
    return () => transformSubModelItems(items as SubModelItem[], context);
  } else {
    let cachedResult: Item[] | null = null;
    return async () => {
      if (!cachedResult) {
        cachedResult = await transformSubModelItems(items as SubModelItem[], context);
      }
      return cachedResult;
    };
  }
};

// ============================================================================
// 删除处理器
// ============================================================================

/**
 * 创建默认删除处理器
 */
const createDefaultRemoveHandler = (config: {
  model: FlowModel;
  subModelKey: string;
  subModelType: 'object' | 'array';
}) => {
  return async (item: SubModelItem, _context: AddSubModelContext): Promise<void> => {
    const { model, subModelKey, subModelType } = config;

    if (subModelType === 'array') {
      const subModels = (model.subModels as any)[subModelKey] as FlowModel[];
      if (Array.isArray(subModels)) {
        const createOpts = getCreateModelOptions(item);
        const targetModel = subModels.find((subModel) => {
          if (createOpts?.use) {
            try {
              const modelClass = config.model.flowEngine.getModelClass(createOpts.use);
              if (modelClass && subModel instanceof modelClass) {
                return true;
              }
            } catch (error) {
              // 如果获取模型类失败，继续使用 uid 匹配
            }
            return (subModel as any).uid.includes(createOpts.use);
          }
          return false;
        });

        if (targetModel) {
          await targetModel.destroy();
          const index = subModels.indexOf(targetModel);
          if (index > -1) subModels.splice(index, 1);
        }
      }
    } else {
      const subModel = (model.subModels as any)[subModelKey] as FlowModel;
      if (subModel) {
        await subModel.destroy();
        (model.subModels as any)[subModelKey] = undefined;
      }
    }
  };
};

// ============================================================================
// 主组件
// ============================================================================

/**
 * 为 FlowModel 实例添加子模型的通用按钮组件
 *
 * 功能特性：
 * - 支持异步加载 items
 * - 支持多层级嵌套菜单
 * - 支持从 flowEngine 全局上下文获取服务
 * - 支持 unique 菜单项的开关切换
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
  keepDropdownOpen = false,
}: AddSubModelButtonProps) {
  // 构建上下文对象
  const buildContext = useMemo(
    () => createBuildContext(model, subModelBaseClass),
    [model, model.flowEngine, subModelBaseClass],
  );

  // 创建删除处理器
  const removeHandler = useMemo(
    () =>
      createDefaultRemoveHandler({
        model,
        subModelKey,
        subModelType,
      }),
    [model, subModelKey, subModelType],
  );

  // 点击处理逻辑
  const onClick = async (info: any) => {
    const clickedItem = info.originalItem || info;
    const item = clickedItem.originalItem || (clickedItem as SubModelItem);
    const isToggled = clickedItem.isToggled;

    // 处理可切换菜单项的开关操作
    if (item.toggleDetector && isToggled) {
      try {
        if (item.removeModelOptions?.customRemove) {
          await item.removeModelOptions.customRemove(buildContext, item);
        } else {
          await removeHandler(item, buildContext);
        }
      } catch (error) {
        console.error('Failed to remove sub model:', error);
      }
      return;
    }

    // 处理添加操作
    const createOpts = getCreateModelOptions(item);

    if (!validateCreateModelOptions(createOpts)) {
      return;
    }

    let addedModel: FlowModel | undefined;

    try {
      addedModel = model.flowEngine.createModel({
        ..._.cloneDeep(createOpts),
        parentId: model.uid,
        subKey: subModelKey,
        subType: subModelType,
      });

      addedModel.setParent(model);
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

  return (
    <LazyDropdown
      menu={{
        items: transformItems(items, buildContext),
        onClick,
        keepDropdownOpen,
      }}
    >
      {children}
    </LazyDropdown>
  );
};

export const AddSubModelButton = withFlowDesignMode(AddSubModelButtonCore);
