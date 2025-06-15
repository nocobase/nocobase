import { Collection } from '@nocobase/client';
import { FlowModel } from '@nocobase/flow-engine';
import { Button, MenuProps } from 'antd';
import React from 'react';
import LazyDropdown, { Item, ItemsType } from './LazyDropdown';

interface SubModelItem {
  key: string;
  label: string;
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
  subModelBaseClass?: typeof FlowModel;
  onModelAdded?: (addedModel: FlowModel) => Promise<void>;
  items: SubModelItem[] | (() => SubModelItem[] | Promise<SubModelItem[]>);
  children?: React.ReactNode; // ✅ 支持自定义按钮文本
}

export function AddSubModelButton({
  model,
  subModelKey,
  subModelType = 'array',
  items,
  onModelAdded,
  children,
}: AddSubModelButtonProps) {
  const onClick = async (info) => {
    const item = info.originalItem;
    const createOpts =
      typeof item.createModelOptions === 'function' ? item.createModelOptions(model) : item.createModelOptions;

    const addedModel = model.flowEngine.createModel({ ...createOpts, subKey: subModelKey, subType: subModelType });

    try {
      await addedModel.configureRequiredSteps();

      if (subModelType === 'array') {
        model.addSubModel(subModelKey, createOpts);
      } else {
        model.setSubModel(subModelKey, createOpts);
      }

      if (onModelAdded) {
        await onModelAdded(addedModel);
      }

      await addedModel.save();
    } catch (error) {
      console.error('Failed to add sub model:', error);
      if (addedModel && typeof addedModel.destroy === 'function') {
        await addedModel.destroy();
      }
    }
  };

  return (
    <LazyDropdown menu={{ items, onClick }}>
      <Button>{children ?? '添加子模型'}</Button>
    </LazyDropdown>
  );
}

interface AddBlockButtonProps extends AddSubModelButtonProps {
  collection: Collection;
}

export function AddBlockButton(props: AddBlockButtonProps) {
  return <AddSubModelButton {...props}>Add block</AddSubModelButton>;
}

interface AddFieldButtonProps extends AddSubModelButtonProps {
  collection: Collection;
}

export function AddFieldButton(props: AddFieldButtonProps) {
  return <AddSubModelButton {...props}>Configure fields</AddSubModelButton>;
}

interface AddActionButtonProps extends AddSubModelButtonProps {
  collection: Collection;
}

export function AddActionButton(props: AddActionButtonProps) {
  return <AddSubModelButton {...props}>Configure actions</AddSubModelButton>;
}
