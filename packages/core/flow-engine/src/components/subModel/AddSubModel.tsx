/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FlowModel } from '@nocobase/flow-engine';
import { Button, MenuProps } from 'antd';
import React from 'react';
import LazyDropdown, { Item, ItemsType } from './LazyDropdown';
import { withFlowDesignMode } from '../common/withFlowDesignMode';

interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider'; // 支持 group 类型
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: SubModelItem[] | (() => SubModelItem[] | Promise<SubModelItem[]>);
  createModelOptions?:
    | { use: string; stepParams?: Record<string, any> }
    | ((parentModel: FlowModel) => { use: string; stepParams?: Record<string, any> });
}

interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  subModelBaseClass?: string | typeof FlowModel;
  onModelCreated?: (addedModel: FlowModel) => Promise<void>;
  onSubModelAdded?: (addedModel: FlowModel) => Promise<void>;
  items: SubModelItem[] | (() => SubModelItem[] | Promise<SubModelItem[]>);
  children?: React.ReactNode; // ✅ 支持自定义按钮文本
}

const AddSubModelCore = function AddSubModel({
  model,
  subModelKey,
  subModelType = 'array',
  items,
  onModelCreated,
  onSubModelAdded,
  children,
}: AddSubModelButtonProps) {
  const onClick = async (info) => {
    const item = info.originalItem;
    const createOpts =
      typeof item.createModelOptions === 'function' ? item.createModelOptions(model) : item.createModelOptions;

    const addedModel = model.flowEngine.createModel({ ...createOpts, subKey: subModelKey, subType: subModelType });

    try {
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
      console.error('Failed to add sub model:', error);
      if (addedModel && typeof addedModel.destroy === 'function') {
        await addedModel.destroy();
      }
    }
  };

  return <LazyDropdown menu={{ items, onClick }}>{children}</LazyDropdown>;
};

export const AddSubModel = withFlowDesignMode(AddSubModelCore);

interface AddBlockButtonProps extends AddSubModelButtonProps {
  collection: Collection;
}

const AddBlockModelCore = function AddBlockModel(props: AddBlockButtonProps) {
  return <AddSubModel {...props}>Add block</AddSubModel>;
};

export const AddBlockModel = withFlowDesignMode(AddBlockModelCore);

interface AddFieldButtonProps extends AddSubModelButtonProps {
  collection: Collection;
}

const AddFieldModelCore = function AddFieldModel(props: AddFieldButtonProps) {
  return <AddSubModel {...props}>{props.children || <Button>Configure fields</Button>}</AddSubModel>;
};

export const AddFieldModel = withFlowDesignMode(AddFieldModelCore);

type AddActionButtonProps = AddSubModelButtonProps;

const AddActionModelCore = function AddActionModel(props: AddActionButtonProps) {
  return <AddSubModel {...props}>{props.children || 'Configure actions'}</AddSubModel>;
};

export const AddActionModel = withFlowDesignMode(AddActionModelCore);
