/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { Button, ButtonProps, Dropdown, MenuProps } from 'antd';
import React from 'react';
import { FlowModel } from '../../models';
import { CreateModelOptions, ModelConstructor } from '../../types';
import _ from 'lodash';

export interface AddSubModelMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  item: typeof FlowModel;
  use: string;
  // unique?: boolean;
  // added?: FlowModel;
}

export interface AddSubModelButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * 父模型类名，用于确定支持的块类型
   */
  ParentModelClass?: string | ModelConstructor;

  /**
   * 父模型实例
   */
  model: FlowModel;

  /**
   * 子模型类型列表
   */
  items: AddSubModelMenuItem[];

  /**
   * 子模型类型：'object' 表示单个子模型，'array' 表示子模型数组
   */
  subModelType: 'object' | 'array';

  /**
   * 子模型在父模型中的键名
   */
  subModelKey: string;

  /**
   * 点击后的回调函数
   */
  onModelAdded?: (subModel: FlowModel, item: AddSubModelMenuItem) => Promise<void>;

  /**
   * 按钮文本，默认为 "Add"
   */
  children?: React.ReactNode;

  buildSubModelParams?: (item: AddSubModelMenuItem) => CreateModelOptions | FlowModel;
}

const defaultSubmodelParams = (item: AddSubModelMenuItem) => {
  if (item.item?.meta?.defaultOptions) {
    return { ..._.cloneDeep(item.item.meta.defaultOptions), use: item.use };
  } else {
    return {
      use: item.use,
    };
  }
};

/**
 * 为 FlowModel 实例添加子模型的通用按钮组件
 *
 * 功能特性：
 * - 当 items 数组为空或只有一个选项时，显示普通按钮，点击直接添加
 * - 当 items 数组有多个选项时，显示带下拉箭头的按钮，鼠标悬停显示选项菜单
 * - 支持自定义图标和标签
 * - 自动处理子模型的创建、保存和回调
 *
 */
export const AddSubModelButton: React.FC<AddSubModelButtonProps> = observer(
  ({
    model,
    items,
    ParentModelClass,
    subModelType,
    subModelKey,
    onModelAdded,
    children = 'Add',
    buildSubModelParams = defaultSubmodelParams,
    ...buttonProps
  }) => {
    const handleAddSubModel = async (selectedItem?: any) => {
      try {
        const item = selectedItem || items[0];

        const subModelOptions = buildSubModelParams(item);

        let subModel: FlowModel;

        if (subModelOptions instanceof FlowModel) {
          subModel = subModelOptions;
        } else {
          subModel = model.flowEngine.createModel({ ...subModelOptions, subKey: subModelKey, subType: subModelType });
        }

        try {
          await subModel.configureRequiredSteps();
          if (onModelAdded) {
            onModelAdded(subModel, item);
          }
          if (subModelType === 'array') {
            subModel = model.addSubModel(subModelKey, subModel);
          } else {
            subModel = model.setSubModel(subModelKey, subModel);
          }
          await subModel.save();
        } catch (error) {
          console.error('Failed to add sub model:', error);
          await subModel.destroy();
        }
      } catch (error) {
        console.error('Failed to add sub model:', error);
      }
    };

    const menuItems: MenuProps['items'] = items.map((item) => ({
      key: item.key,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        </div>
      ),
      disabled: false,
      onClick: () => {
        handleAddSubModel(item);
      },
    }));

    return (
      <Dropdown menu={{ items: menuItems }} trigger={['hover']} placement="bottomLeft">
        <Button {...buttonProps}>{children}</Button>
      </Dropdown>
    );
  },
);

AddSubModelButton.displayName = 'AddSubModelButton';
