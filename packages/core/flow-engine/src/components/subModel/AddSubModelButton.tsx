/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Switch } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { FlowModelContext } from '../../flowContext';
import { FlowModel } from '../../models';
import { CreateModelOptions, ModelConstructor } from '../../types';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import LazyDropdown, { Item, ItemsType } from './LazyDropdown';
import { buildItems, buildSubModelGroups, buildSubModelItems } from './utils';

// ============================================================================
// 类型定义
// ============================================================================

type CreateModelOptionsStringUse = Omit<CreateModelOptions, 'use'> & { use?: string };
type CreateModelOptionsFn = (
  ctx: FlowModelContext,
  extra?: any,
) => CreateModelOptionsStringUse | Promise<CreateModelOptionsStringUse>;

type HideOrFactory = boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);

export interface SubModelItem {
  key?: string;
  label?: string | React.ReactNode;
  type?: 'group' | 'divider';
  disabled?: boolean;
  /**
   * 动态隐藏菜单项（支持异步）。与模型 meta.hide 语义一致。
   * - `true` 表示隐藏
   * - function(ctx) 返回 true 表示隐藏
   */
  hide?: HideOrFactory;
  icon?: React.ReactNode;
  children?: false | SubModelItemsType;
  createModelOptions?: CreateModelOptionsStringUse | CreateModelOptionsFn;
  searchable?: boolean;
  searchPlaceholder?: string;
  keepDropdownOpen?: boolean;
  toggleable?: boolean | ((model: FlowModel) => boolean); // 是否支持切换
  useModel?: string;
  sort?: number;
  toggleDetector?: (ctx: FlowModelContext) => boolean | Promise<boolean>;
  customRemove?: (ctx: FlowModelContext, item: SubModelItem) => Promise<void>;
  // 点击该项后，还需联动刷新的其他菜单路径前缀（由具体定义方提供）
  refreshTargets?: string[];
}

export type SubModelItemsType = SubModelItem[] | ((ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>);

export interface MergeSubModelItemsOptions {
  addDividers?: boolean;
}

interface AddSubModelButtonProps {
  model: FlowModel;
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  subModelType?: 'object' | 'array';
  subModelKey: string;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
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
  padding: '0',
} as const;

const SWITCH_STYLE = {
  marginLeft: 8,
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
const getCreateModelOptions = async (item: SubModelItem, ctx: FlowModelContext) => {
  let createOpts = item.createModelOptions;
  if (typeof createOpts === 'function') {
    createOpts = await createOpts(ctx);
  }
  return {
    use: item.useModel,
    ...createOpts,
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

  return async (ctx: FlowModelContext) => {
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
  // 递归检查静态 children 是否包含 toggleable 项；
  // children 为函数时无法预判，出于正确性优先，视为可能包含 toggleable，从而禁用缓存。
  const walk = (nodes: SubModelItem[]): boolean => {
    for (const node of nodes) {
      if (!node) continue;
      // hide 为函数时菜单可见性依赖运行时上下文，应禁用缓存
      if (typeof node.hide === 'function') return true;
      if (!node.children && (node.toggleDetector || node.toggleable)) return true;
      if (Array.isArray(node.children)) {
        if (walk(node.children)) return true;
      } else if (typeof node.children === 'function') {
        return true; // 保守处理：函数型 children 可能包含 toggleable
      }
    }
    return false;
  };
  return walk(items);
};

const isHidden = async (item: SubModelItem, ctx: FlowModelContext): Promise<boolean> => {
  const hide = item.hide;
  if (!hide) return false;
  if (typeof hide === 'function') {
    return !!(await hide(ctx));
  }
  return !!hide;
};

const hasVisibleSubModelItems = async (items: SubModelItem[], ctx: FlowModelContext): Promise<boolean> => {
  for (const item of items) {
    if (!item) continue;
    try {
      if (await isHidden(item, ctx)) continue;
    } catch (e) {
      console.error('[NocoBase]: Failed to resolve item.hide:', e);
    }

    if (Array.isArray(item.children)) {
      const hasVisibleChildren = await hasVisibleSubModelItems(item.children, ctx);
      if (hasVisibleChildren) return true;

      if (item.type === 'group' || !item.createModelOptions) {
        continue;
      }
      return true;
    }

    if (typeof item.children === 'function') {
      return true;
    }

    return true;
  }

  return false;
};

/**
 * 递归转换 SubModelItem 数组为 LazyDropdown 的 Item 格式
 */
const transformSubModelItems = async (
  items: SubModelItem[],
  model: FlowModel,
  subModelKey,
  subModelType,
): Promise<Item[]> => {
  if (items.length === 0) return [];

  // 动态隐藏：按当前 FlowModelContext 过滤（支持异步）
  const hidden = await Promise.all(
    items.map(async (item) => {
      if (!item) return true;
      try {
        return await isHidden(item, model.context);
      } catch (e) {
        console.error('[NocoBase]: Failed to resolve item.hide:', e);
        return false; // 出错时保守显示
      }
    }),
  );
  const visibleItems = items.filter((item, idx) => !!item && !hidden[idx]);

  if (visibleItems.length === 0) return [];

  // 批量收集需要异步检测的可切换项
  const toggleItems: Array<{ item: SubModelItem; index: number }> = [];
  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];

    // 自动从 createModelOptions 中推断 useModel，避免遗漏导致 toggleable 失效
    let resolvedUseModel = item.useModel;
    if (!resolvedUseModel && item.toggleable) {
      try {
        const createOpts = await getCreateModelOptions(item, model.context);
        resolvedUseModel = createOpts?.use;
        if (resolvedUseModel) {
          item.useModel = resolvedUseModel;
        }
      } catch (error) {
        // ignore and fall back to existing useModel
        console.error('[NocoBase]: Failed to resolve useModel for toggleable item:', error);
      }
    }

    if (item.toggleable && resolvedUseModel) {
      item.toggleDetector = (ctx) => {
        const C = ctx.engine.getModelClass(resolvedUseModel); // 确保 use 是有效的模型类
        const r = ctx.model.findSubModel(subModelKey, (m) => {
          if (item.toggleable === true) {
            return m.constructor === C;
          } else if (typeof item.toggleable === 'function') {
            return item.toggleable(m);
          }
        });
        return !!r;
      };
      item.customRemove = async (ctx, item) => {
        const C = ctx.engine.getModelClass(resolvedUseModel); // 确保 use 是有效的模型类
        const r = ctx.model.findSubModel(subModelKey, (m) => {
          if (item.toggleable === true) {
            return m.constructor === C;
          } else if (typeof item.toggleable === 'function') {
            return item.toggleable(m);
          }
        });
        if (r) {
          await r.destroy();
        }
      };
    }
    if (item.toggleDetector && !item.children) {
      toggleItems.push({ item, index: i });
    }
  }

  // 批量执行 toggleDetector
  const toggleResults = await Promise.allSettled(
    toggleItems.map(({ item }) => (item.toggleDetector ? item.toggleDetector(model.context) : Promise.resolve(false))),
  );

  const toggleMap = new Map<number, boolean>();
  toggleItems.forEach(({ index }, i) => {
    const result = toggleResults[i];
    toggleMap.set(index, result.status === 'fulfilled' ? result.value : false);
  });

  // 并发转换所有项目
  const transformPromises = visibleItems.map(async (item, index): Promise<Item | null> => {
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
          const childrenFn = item.children as (ctx: FlowModelContext) => SubModelItem[] | Promise<SubModelItem[]>;
          const childrenResult = await childrenFn(model.context);
          return transformSubModelItems(childrenResult, model, subModelKey, subModelType);
        };
      } else {
        const staticChildren = item.children as SubModelItem[];
        // 仅当子树包含 toggleable/动态函数时，才转为惰性函数；否则保留为静态数组，兼容现有测试与用法
        const childHasToggle = hasToggleItems(staticChildren);
        if (childHasToggle) {
          const hasVisibleChildren = await hasVisibleSubModelItems(staticChildren, model.context);
          if (!hasVisibleChildren) {
            if (item.type === 'group' || !item.createModelOptions) {
              return null;
            }
          } else {
            transformedItem.children = async () =>
              transformSubModelItems(staticChildren, model, subModelKey, subModelType);
          }
        } else {
          transformedItem.children = await transformSubModelItems(staticChildren, model, subModelKey, subModelType);
        }
      }
    }

    // group/submenu 若最终无子项，则不展示该分组，避免空分组残留
    if (Array.isArray(transformedItem.children) && transformedItem.children.length === 0) {
      if (item.type === 'group' || !item.createModelOptions) {
        return null;
      }
    }

    // 处理开关式菜单项
    if (item.toggleDetector && !item.children) {
      const isToggled = toggleMap.get(index) || false;
      const originalLabel = model.translate(item.label) || '';
      transformedItem.label = createSwitchLabel(originalLabel, isToggled);
      transformedItem.isToggled = isToggled;
      // toggleable 项默认保持下拉菜单打开，便于连续操作
      transformedItem.keepDropdownOpen = item.keepDropdownOpen ?? true;
      // Note: toggle state for each leaf can be numerous and noisy; omit per-item logs to avoid UI lag.
    }

    return transformedItem;
  });

  const transformed = await Promise.all(transformPromises);
  return transformed.filter((item): item is Item => !!item);
};

/**
 * 转换 SubModelItemsType 到 LazyDropdown 的 ItemsType 格式
 */
export const transformItems = (
  items: SubModelItemsType,
  model: FlowModel,
  subModelKey: string,
  subModelType: string,
): ItemsType => {
  if (typeof items === 'function') {
    return async () => {
      const result = await items(model.context);
      return transformSubModelItems(result, model, subModelKey, subModelType);
    };
  }

  const hasToggle = hasToggleItems(items as SubModelItem[]);
  if (hasToggle) {
    // 存在 toggle，则每次重算（以更新开关状态）
    return () => transformSubModelItems(items as SubModelItem[], model, subModelKey, subModelType);
  } else {
    // 无 toggle，保留缓存，满足“二次调用同一引用”的用例
    let cachedResult: Item[] | null = null;
    return async () => {
      if (!cachedResult) {
        cachedResult = await transformSubModelItems(items as SubModelItem[], model, subModelKey, subModelType);
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
  return async (item: SubModelItem, parentModel: FlowModel): Promise<FlowModel | null> => {
    const { model, subModelKey, subModelType } = config;

    if (subModelType === 'array') {
      const subModels = (model.subModels as any)[subModelKey] as FlowModel[];
      if (Array.isArray(subModels)) {
        const createOpts = await getCreateModelOptions(item, parentModel.context);
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
          return targetModel;
        }
      }
    } else {
      const subModel = (model.subModels as any)[subModelKey] as FlowModel;
      if (subModel) {
        await subModel.destroy();
        (model.subModels as any)[subModelKey] = undefined;
        return subModel;
      }
    }
    return null;
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
  subModelBaseClasses,
  subModelType = 'array',
  subModelKey,
  afterSubModelInit,
  afterSubModelAdd,
  afterSubModelRemove,
  children = 'Add',
  keepDropdownOpen = false,
}: AddSubModelButtonProps) {
  const persistKey = useMemo(() => {
    try {
      const id = (model && (model as any).uid) || 'unknown-model';
      return `asmb:${id}:${subModelKey}:${subModelType}`;
    } catch (e) {
      return `asmb:unknown:${subModelKey}:${subModelType}`;
    }
  }, [model, subModelKey, subModelType]);
  // Internal tick to force reloading menu items when subModels change
  const [refreshTick, setRefreshTick] = React.useState(0);
  // 最近一次点击的菜单 key，用于引导 LazyDropdown 精准刷新路径
  // 以 refreshKeys 单一数组表示刷新路径（首个为当前点击路径）
  const [refreshKeys, setRefreshKeys] = React.useState<string[] | undefined>(undefined);
  // 合并 items 与 baseClass 的菜单来源
  const finalItems = useMemo<SubModelItemsType>(() => {
    const sources: (SubModelItemsType | undefined | null)[] = [];
    if (items) sources.push(items);
    if (subModelBaseClass) sources.push(buildItems(subModelBaseClass));
    if (subModelBaseClasses && subModelBaseClasses.length > 0) {
      sources.push(buildSubModelGroups(subModelBaseClasses));
    }
    return mergeSubModelItems(sources, { addDividers: true });
  }, [items, subModelBaseClass, subModelBaseClasses]);
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
    const clickedKey: string | undefined = info?.key;
    if (clickedKey) {
      const extras = (item as SubModelItem)?.refreshTargets || [];
      setRefreshKeys([clickedKey, ...extras]);
    }

    // 处理可切换菜单项的开关操作
    if (item.toggleDetector && isToggled) {
      try {
        // 先定位将要删除的 subModel，供回调使用
        let removedModel: FlowModel | null = null;
        try {
          const C = model.flowEngine.getModelClass(item.useModel);
          if (C) {
            removedModel = model.findSubModel(subModelKey, (m) => m.constructor === C);
          }
        } catch (e) {
          // Ignore error
        }

        if (item.customRemove) {
          await item.customRemove(model.context, item);
        } else {
          removedModel = (await removeHandler(item, model)) || removedModel;
        }

        if (afterSubModelRemove && removedModel) {
          await afterSubModelRemove(removedModel);
        }
        // Force refresh items so toggle state recalculates while dropdown stays open
        setRefreshTick((x) => x + 1);
      } catch (error) {
        console.error('Failed to remove sub model:', error);
      }
      return;
    }

    // 处理添加操作
    const createOpts = await getCreateModelOptions(item, model.context);

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

      addedModel.isNew = true; // 强制标记为新建状态
      addedModel.setParent(model);

      const toAdd = async () => {
        try {
          if (afterSubModelInit) {
            await afterSubModelInit(addedModel);
          }

          if (subModelType === 'array') {
            model.addSubModel(subModelKey, addedModel);
          } else {
            model.setSubModel(subModelKey, addedModel);
          }

          if (afterSubModelAdd) {
            await afterSubModelAdd(addedModel);
          }

          await addedModel.afterAddAsSubModel();

          await addedModel.save();
          addedModel.isNew = false;
          // Force refresh items so toggle state recalculates while dropdown stays open
          setRefreshTick((x) => x + 1);
        } catch (error) {
          await handleModelCreationError(error, addedModel);
        }
      };

      // 在创建 Model 之前，需要先填写预设的配置表单
      const opened = await addedModel.openFlowSettings({
        preset: true,
        onSaved: async () => {
          await toAdd();
        },
      });
      if (!opened) {
        await toAdd();
      }
    } catch (error) {
      await handleModelCreationError(error, addedModel);
    }
  };

  const itemsFactory = useMemo(
    () => transformItems(finalItems, model, subModelKey, subModelType),
    [finalItems, model, subModelKey, subModelType],
  );

  return (
    <LazyDropdown
      menu={{
        items: itemsFactory,
        onClick,
        keepDropdownOpen,
        persistKey,
        stateVersion: refreshTick,
        refreshKeys,
      }}
    >
      {children}
    </LazyDropdown>
  );
};

export const AddSubModelButton = withFlowDesignMode(AddSubModelButtonCore);
