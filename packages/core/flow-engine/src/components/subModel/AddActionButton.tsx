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
import { FlowModel } from '../../models/flowModel';
import { ModelConstructor } from '../../types';
import { FlowSettingsButton } from '../common/FlowSettingsButton';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import { AddSubModelButton, SubModelItemsType } from './AddSubModelButton';
import { useTranslation } from 'react-i18next';

interface AddActionButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于确定支持的 Actions 类型
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  /**
   * 创建后的回调函数
   */
  onModelCreated?: (subModel: FlowModel) => Promise<void>;
  /**
   * 添加到父模型后的回调函数
   */
  onSubModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 按钮文本
   */
  children?: React.ReactNode;
  /**
   * 过滤Model菜单的函数
   */
  filter?: (blockClass: ModelConstructor, className: string) => boolean;
  /**
   * 自定义 items（如果提供，将覆盖默认的action菜单）
   */
  items?: SubModelItemsType;
}

const DefaultBtn = () => {
  const { t } = useTranslation();
  return <FlowSettingsButton icon={<SettingOutlined />}>{t('Configure actions')}</FlowSettingsButton>;
};

/**
 * 专门用于添加动作模型的按钮组件
 *
 * @example
 * ```tsx
 * <AddActionButton
 *   model={parentModel}
 *   subModelBaseClass={'ActionFlowModel'}
 * />
 * ```
 */
const AddActionButtonCore: React.FC<AddActionButtonProps> = ({
  model,
  subModelBaseClass = 'ActionFlowModel',
  subModelKey = 'actions',
  children = <DefaultBtn />,
  subModelType = 'array',
  items,
  filter,
  onModelCreated,
  onSubModelAdded,
}) => {
  const allActionsItems = useMemo(() => {
    const actionClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
    const registeredBlocks = [];
    for (const [className, ModelClass] of actionClasses) {
      if (filter && !filter(ModelClass, className)) {
        continue;
      }
      if (ModelClass.meta?.hide) {
        continue;
      }
      const item = {
        key: className,
        label: ModelClass.meta?.title || className,
        icon: ModelClass.meta?.icon,
        createModelOptions: {
          ...ModelClass.meta?.defaultOptions,
          use: className,
        },
      };
      registeredBlocks.push(item);
    }
    return registeredBlocks;
  }, [model, subModelBaseClass]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={items ?? allActionsItems}
      onModelCreated={onModelCreated}
      onSubModelAdded={onSubModelAdded}
    >
      {children}
    </AddSubModelButton>
  );
};

export const AddActionButton = withFlowDesignMode(AddActionButtonCore);

AddActionButton.displayName = 'AddActionButton';
