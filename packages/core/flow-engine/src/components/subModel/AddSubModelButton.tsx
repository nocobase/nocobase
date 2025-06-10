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
import { DownOutlined } from '@ant-design/icons';
import React from 'react';
import { FlowModel } from '../../models';
import { CreateModelOptions } from '../../types';
import { generateUid } from '../../utils';

export interface AddSubModelButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * 父模型实例
   */
  model: FlowModel;
  
  /**
   * 子模型类型：'object' 表示单个子模型，'array' 表示子模型数组
   */
  subModelType: 'object' | 'array';
  
  /**
   * 子模型在父模型中的键名
   */
  subModelKey: string;
  
  /**
   * 可选的子模型选项列表，用于显示选择菜单
   */
  items?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    [key: string]: any;
  }>;
  
  /**
   * 构建子模型参数的函数
   * @param info 包含用户选择信息的对象
   * @returns CreateModelOptions 创建子模型的选项
   */
  buildSubModelParams: (info: {
    key: string;
    item?: any;
    model: FlowModel;
  }) => CreateModelOptions;
  
  /**
   * 点击后的回调函数
   */
  onAfterAdd?: (subModel: FlowModel) => void;
  
  /**
   * 按钮文本，默认为 "Add"
   */
  children?: React.ReactNode;
}

/**
 * 为 FlowModel 实例添加子模型的通用按钮组件
 * 
 * 功能特性：
 * - 当 items 数组为空或只有一个选项时，显示普通按钮，点击直接添加
 * - 当 items 数组有多个选项时，显示带下拉箭头的按钮，鼠标悬停显示选项菜单
 * - 支持自定义图标和标签
 * - 自动处理子模型的创建、保存和回调
 * 
 * @example
 * ```tsx
 * // 单个选项或无选项 - 显示普通按钮
 * <AddSubModelButton 
 *   model={parentModel}
 *   subModelType="array"
 *   subModelKey="fields"
 *   items={[{ key: 'text', label: 'Text Field' }]}
 *   buildSubModelParams={(info) => ({ use: 'FieldModel' })}
 * />
 * 
 * // 多个选项 - 显示下拉菜单按钮
 * <AddSubModelButton 
 *   model={parentModel}
 *   subModelType="array"
 *   subModelKey="fields"
 *   items={[
 *     { key: 'text', label: 'Text Field', icon: <TextIcon /> },
 *     { key: 'number', label: 'Number Field', icon: <NumberIcon /> }
 *   ]}
 *   buildSubModelParams={(info) => ({
 *     use: 'FieldModel',
 *     stepParams: {
 *       default: {
 *         step1: {
 *           fieldType: info.key,
 *         },
 *       },
 *     },
 *   })}
 * />
 * ```
 */
export const AddSubModelButton: React.FC<AddSubModelButtonProps> = observer(({
  model,
  subModelType,
  subModelKey,
  items = [],
  buildSubModelParams,
  onAfterAdd,
  children = 'Add',
  ...buttonProps
}) => {
  const handleAddSubModel = async (selectedItem?: any) => {
    try {
      const item = selectedItem || items[0];
      const key = item?.key || generateUid();
      
      const subModelOptions = buildSubModelParams({
        key,
        item,
        model,
      });
      
      let subModel: FlowModel = model.flowEngine.createModel(subModelOptions);
      
      try {
        await subModel.configureRequiredSteps();
        if (onAfterAdd) {
          onAfterAdd(subModel);
        }
        await subModel.save();
        if (subModelType === 'array') {
          subModel = model.addSubModel(subModelKey, subModel);
        } else {
          subModel = model.setSubModel(subModelKey, subModel);
        }
      } catch (error) {
        console.error('Failed to add sub model:', error);
        await subModel.destroy();
      }
    } catch (error) {
      console.error('Failed to add sub model:', error);
    }
  };

  const handleClick = async () => {
    // 如果没有提供 items 或只有一个选项，直接添加
    if (items.length <= 1) {
      await handleAddSubModel();
    }
    // 如果有多个选项，点击事件由 Dropdown 处理
  };

  // 如果有多个选项，显示下拉菜单
  if (items.length > 1) {
    const menuItems: MenuProps['items'] = items.map((item) => ({
      key: item.key,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ),
      onClick: () => handleAddSubModel(item),
    }));

    return (
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['hover']}
        placement="bottomLeft"
      >
        <Button
          {...buttonProps}
          onClick={handleClick}
        >
          {children}
          <DownOutlined style={{ marginLeft: 4, fontSize: 12 }} />
        </Button>
      </Dropdown>
    );
  }

  // 单个选项或无选项时，显示普通按钮
  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
});

AddSubModelButton.displayName = 'AddSubModelButton';
