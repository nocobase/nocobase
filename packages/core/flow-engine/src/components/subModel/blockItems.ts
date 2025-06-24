/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, DataSource, DataSourceManager } from '../../data-source';
import { FlowModel } from '../../models/flowModel';
import { ModelConstructor } from '../../types';
import { isInheritedFrom } from '../../utils';
import { SubModelItem, SubModelItemsType } from './AddSubModelButton';

export interface BlockItemsOptions {
  /**
   * 子模型基类，用于确定支持的区块类型
   */
  subModelBaseClass?: string | ModelConstructor;
  /**
   * 过滤区块类型的函数
   */
  filterBlocks?: (blockClass: ModelConstructor, className: string) => boolean;
  /**
   * 自定义区块选项
   */
  customBlocks?: SubModelItem[];
}

/**
 * 获取数据源和数据表信息
 * 从 flowEngine 的全局上下文获取数据源管理器信息
 */
async function getDataSourcesWithCollections(model: FlowModel) {
  try {
    // 从 flowEngine 的全局上下文获取数据源管理器
    const globalContext = model.flowEngine.getContext();
    const dataSourceManager: DataSourceManager = globalContext?.dataSourceManager;

    if (!dataSourceManager) {
      // 如果没有数据源管理器，返回空数组
      return [];
    }

    // 获取所有数据源
    const allDataSources: DataSource[] = dataSourceManager.getDataSources();

    // 转换为我们需要的格式
    return allDataSources.map((dataSource: DataSource) => {
      const key = dataSource.key;
      const displayName = dataSource.displayName || dataSource.key;

      // 从 collectionManager 获取 collections
      const collections: Collection[] = dataSource.getCollections();

      return {
        key,
        displayName,
        collections: collections.map((collection: Collection) => ({
          name: collection.name,
          title: collection.title,
          dataSource: key,
        })),
      };
    });
  } catch (error) {
    console.warn('Failed to get data sources:', error);
    // 返回空数组，不提供假数据
    return [];
  }
}

/**
 * 创建区块菜单项的工具函数
 *
 * 根据继承关系动态生成区块菜单结构：
 * - 数据区块：继承自 DataBlockModel 的区块，区块类型 → 数据源 → 数据表的层级结构
 * - 筛选区块：继承自 FilterBlockModel 的区块，平铺的区块列表
 * - 其他区块：其他类型的区块，平铺的区块列表
 *
 * @param model FlowModel 实例
 * @param options 配置选项
 * @returns SubModelItemsType 格式的菜单项
 */
export function createBlockItems(model: FlowModel, options: BlockItemsOptions = {}): SubModelItemsType {
  const { subModelBaseClass = 'BlockFlowModel', filterBlocks: filterFn, customBlocks = [] } = options;

  // 获取所有注册的区块类
  const blockClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);

  // 获取基础类用于继承检查
  const DataBlockModelClass = model.flowEngine.getModelClass('DataBlockModel');
  const FilterBlockModelClass = model.flowEngine.getModelClass('FilterBlockModel');

  // 分类区块：数据区块, 筛选区块, 其他区块
  const dataBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];
  const filterBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];
  const otherBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];

  for (const [className, ModelClass] of blockClasses) {
    // 应用过滤器
    if (filterFn && !filterFn(ModelClass, className)) {
      continue;
    }

    // 排除基类本身
    if (className === 'DataBlockModel' || className === 'FilterBlockModel') {
      continue;
    }

    // 使用继承关系判断区块类型
    let isDataBlock = false;
    let isFilterBlock = false;

    if (DataBlockModelClass && isInheritedFrom(ModelClass, DataBlockModelClass)) {
      isDataBlock = true;
    } else if (FilterBlockModelClass && isInheritedFrom(ModelClass, FilterBlockModelClass)) {
      isFilterBlock = true;
    }

    if (isDataBlock) {
      dataBlocks.push({ className, ModelClass });
    } else if (isFilterBlock) {
      filterBlocks.push({ className, ModelClass });
    } else {
      otherBlocks.push({ className, ModelClass });
    }
  }

  const result: SubModelItem[] = [];

  // 数据区块分组
  if (dataBlocks.length > 0) {
    result.push({
      key: 'dataBlocks',
      label: 'Data blocks',
      type: 'group',
      children: async () => {
        const dataSources = await getDataSourcesWithCollections(model);

        // 按区块类型组织菜单：区块 → 数据源 → 数据表
        return dataBlocks.map(({ className, ModelClass }) => {
          const meta = (ModelClass as any).meta;
          return {
            key: className,
            label: meta?.title || className,
            icon: meta?.icon,
            children: dataSources.map((dataSource) => ({
              key: `${className}.${dataSource.key}`,
              label: dataSource.displayName,
              children: dataSource.collections.map((collection) => ({
                key: `${className}.${dataSource.key}.${collection.name}`,
                label: collection.title || collection.name,
                createModelOptions: {
                  ...meta?.defaultOptions,
                  use: className,
                  stepParams: {
                    default: {
                      step1: {
                        dataSourceKey: dataSource.key,
                        collectionName: collection.name,
                      },
                    },
                  },
                },
              })),
            })),
          };
        });
      },
    });
  }

  // 筛选区块分组
  if (filterBlocks.length > 0) {
    const filterBlockItems = filterBlocks.map(({ className, ModelClass }) => {
      const meta = (ModelClass as any).meta;
      return {
        key: className,
        label: meta?.title || className,
        icon: meta?.icon,
        createModelOptions: {
          ...meta?.defaultOptions,
          use: className,
        },
      };
    });

    result.push({
      key: 'filterBlocks',
      label: 'Filter blocks',
      type: 'group',
      children: filterBlockItems,
    });
  }

  // 其他区块分组
  if (otherBlocks.length > 0 || customBlocks.length > 0) {
    const otherBlockItems = [
      ...otherBlocks.map(({ className, ModelClass }) => {
        const meta = (ModelClass as any).meta;
        return {
          key: className,
          label: meta?.title || className,
          icon: meta?.icon,
          createModelOptions: {
            ...meta?.defaultOptions,
            use: className,
          },
        };
      }),
      ...customBlocks,
    ];

    result.push({
      key: 'otherBlocks',
      label: 'Other blocks',
      type: 'group',
      children: otherBlockItems,
    });
  }

  return result;
}
