/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { Button, ButtonProps, Dropdown, MenuProps, Switch } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { FlowModel } from '../../models';
import { CreateModelOptions, ModelConstructor } from '../../types';
import { generateUid } from '../../utils';
import _ from 'lodash';

export interface AddSubModelItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  item: typeof FlowModel;
  use: string;
  props?: Record<string, any>;
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
  items: AddSubModelItem[];

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
  onAfterAdd?: (subModel: FlowModel, item: AddSubModelItem) => void;
  
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
 */
export const AddSubModelButton: React.FC<AddSubModelButtonProps> = observer(({
  model,
  items,
  ParentModelClass,
  subModelType,
  subModelKey,
  onAfterAdd,
  children = 'Add',
  ...buttonProps
}) => {
  const [_update, forceUpdate] = React.useState(0);
  const buildSubModelParams = React.useCallback((info: {
    key: string;
  }) => {
    const blockType = items.find(type => type.key === info.key);
    
    if (!blockType) {
      throw new Error(`Unknown block type: ${info.key}`);
    }

    if (blockType.item.meta?.defaultOptions) {
      return { ..._.cloneDeep(blockType.item.meta?.defaultOptions), use: blockType.use, props: blockType.props };
    } else {
      return {
        use: blockType.use,
        props: blockType.props,
      }
    }
  }, [items]);


  const handleAddSubModel = async (selectedItem?: any) => {
    try {
      const item = selectedItem || items[0];
      const key = item?.key || generateUid();
      
      const subModelOptions = buildSubModelParams({ key });
      
      let subModel: FlowModel = model.flowEngine.createModel({...subModelOptions, subKey: subModelKey, subType: 'array'});
      
      try {
        await subModel.configureRequiredSteps();
        if (onAfterAdd) {
          onAfterAdd(subModel, item);
        }
        if (subModelType === 'array') {
          subModel = model.addSubModel(subModelKey, subModel);
        } else {
          subModel = model.setSubModel(subModelKey, subModel);
        }
        await subModel.save();
        
        // 如果是 unique 项目，标记为已添加
        // if (item?.unique) {
        //   item.added = subModel;
        // }
        forceUpdate(prev => prev + 1);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.icon}
            <span>{item.label}</span>
          </div>
          {/* {item.unique && (
            <Switch
              size="small"
              checked={!!item.added}
              onChange={(checked) => {
                if (checked) {
                  handleAddSubModel(item);
                } else {
                  item.added?.destroy();
                  item.added = null;
                  forceUpdate(prev => prev + 1);
                }
              }}
              onClick={(checked, e) => {
                e.stopPropagation();
              }}
            />
          )} */}
        </div>
      ),
      disabled: false, // 不禁用整个菜单项，让开关可以操作
      onClick: () => {
        // if (!item.unique) {
        //   handleAddSubModel(item);
        // }
        handleAddSubModel(item);
      },
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
        </Button>
      </Dropdown>
    );
  }

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
