/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { FlowModel } from '../../models';
import { ModelConstructor } from '../../types';
import { processMetaChildren, resolveDefaultOptions } from '../../utils';
import { FlowSettingsButton } from '../common/FlowSettingsButton';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import { AddSubModelButton, SubModelItem, SubModelItemsType, mergeSubModelItems } from './AddSubModelButton';

export interface AddFieldButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于动态获取额外的菜单项
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  /**
   * 过滤模型菜单的函数
   */
  filter?: (modelClass: ModelConstructor, className: string) => boolean;
  /**
   * 创建后的回调函数
   */
  onModelCreated?: (subModel: FlowModel<any>) => Promise<void>;
  /**
   * 添加到父模型后的回调函数
   */
  onSubModelAdded?: (subModel: FlowModel<any>) => Promise<void>;
  /**
   * 显示的UI组件
   */
  children?: React.ReactNode;
  /**
   * 菜单项
   */
  items: SubModelItemsType;
}

/**
 * 专门用于添加字段模型的按钮组件
 *
 * @example
 * ```tsx
 * <AddFieldButton
 *   model={parentModel}
 *   subModelBaseClass={'TableColumnModel'}
 * />
 * ```
 */
const AddFieldButtonCore: React.FC<AddFieldButtonProps> = ({
  model,
  subModelBaseClass,
  subModelKey = 'fields',
  children,
  subModelType = 'array',
  items,
  filter,
  onModelCreated,
  onSubModelAdded,
}) => {
  const defaultChildren = useMemo(() => {
    return <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>;
  }, [model]);

  // 动态获取基于 subModelBaseClass 的额外菜单项
  const appendItems = useMemo(() => {
    if (!subModelBaseClass) {
      return [];
    }

    const modelClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
    const registeredItems = [];

    for (const [className, ModelClass] of modelClasses) {
      if (filter && !filter(ModelClass, className)) {
        continue;
      }
      if (ModelClass.meta?.hide) {
        continue;
      }

      const meta = ModelClass.meta;

      // 如果模型定义了 children，创建包含子菜单的分组项
      if (meta?.children) {
        const item: SubModelItem = {
          key: className,
          label: meta.title || className,
          icon: meta.icon,
          type: 'group',
          children: async () => {
            return await processMetaChildren(meta.children, model.context, `${className}.`);
          },
        };

        registeredItems.push(item);
      } else {
        // 原有的单个菜单项逻辑
        const item: any = {
          key: className,
          label: meta?.title || className,
          icon: meta?.icon,
          createModelOptions: async () => {
            const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model.context);

            return {
              ...defaultOptions,
              use: className,
            };
          },
        };

        // 从 meta 中获取 toggleDetector
        if (meta?.toggleDetector) {
          item.toggleDetector = meta.toggleDetector;
        }

        if (meta?.customRemove) {
          item.customRemove = meta.customRemove;
        }

        registeredItems.push(item);
      }
    }
    return registeredItems;
  }, [model, subModelBaseClass, filter, subModelKey]);

  const finalItems = useMemo(() => {
    return mergeSubModelItems([items, appendItems], { addDividers: true });
  }, [items, appendItems]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={finalItems}
      onModelCreated={onModelCreated}
      onSubModelAdded={onSubModelAdded}
      keepDropdownOpen
    >
      {children || defaultChildren}
    </AddSubModelButton>
  );
};

// 使用高阶组件包装，优化性能
export const AddFieldButton = withFlowDesignMode(AddFieldButtonCore);

AddFieldButton.displayName = 'AddFieldButton';
