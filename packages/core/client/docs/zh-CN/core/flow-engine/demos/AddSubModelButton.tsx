import { Collection } from '@nocobase/client';
import { FlowModel } from '@nocobase/flow-engine';
import { Button, Dropdown, MenuProps } from 'antd';
import React from 'react';

interface SubModelItem {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  children?: SubModelItem[]; // ✅ 改为数组，支持多级菜单
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
  items: SubModelItem[];
  children?: React.ReactNode; // ✅ 支持自定义按钮文本
}

// 递归构造 antd 的菜单项结构
function toAntdMenuItems(items: SubModelItem[]): MenuProps['items'] {
  return items.map(({ key, label, icon, disabled, children }) => ({
    key,
    icon,
    label,
    disabled,
    children: children ? toAntdMenuItems(children) : undefined,
  }));
}

export function AddSubModelButton({
  model,
  subModelKey,
  subModelType = 'array',
  items,
  onModelAdded,
  children,
}: AddSubModelButtonProps) {
  const menuItems = toAntdMenuItems(items);

  const onClick: MenuProps['onClick'] = async ({ key }) => {
    const flattenItems = (items: SubModelItem[]): SubModelItem[] =>
      items.flatMap((item) => (item.children ? [item, ...flattenItems(item.children)] : [item]));

    const allItems = flattenItems(items);
    const item = allItems.find((i) => i.key === key);
    if (!item) return;

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
    <Dropdown menu={{ items: menuItems, onClick }}>
      <Button>{children ?? '添加子模型'}</Button>
    </Dropdown>
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
