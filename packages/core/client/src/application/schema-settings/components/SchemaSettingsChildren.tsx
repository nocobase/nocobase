import React, { FC, useEffect, useMemo, useRef } from 'react';

import { useFindComponent } from '../../../schema-component';
import {
  SchemaSettingsActionModalItem,
  SchemaSettingsCascaderItem,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsItemGroup,
  SchemaSettingsModalItem,
  SchemaSettingsPopupItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSubMenu,
  SchemaSettingsSwitchItem,
  useSchemaSettings,
} from '../../../schema-settings/SchemaSettings';
import { SchemaSettingItemContext } from '../context';
import { SchemaSettingsItemType } from '../types';
import { uid } from '@formily/shared';

export interface SchemaSettingsChildrenProps {
  children: SchemaSettingsItemType[];
}

const typeComponentMap = {
  item: SchemaSettingsItem,
  itemGroup: SchemaSettingsItemGroup,
  subMenu: SchemaSettingsSubMenu,
  divider: SchemaSettingsDivider,
  remove: SchemaSettingsRemove,
  select: SchemaSettingsSelectItem,
  cascader: SchemaSettingsCascaderItem,
  switch: SchemaSettingsSwitchItem,
  popup: SchemaSettingsPopupItem,
  actionModal: SchemaSettingsActionModalItem,
  modal: SchemaSettingsModalItem,
};

export const SchemaSettingsChildren: FC<SchemaSettingsChildrenProps> = (props) => {
  const { children } = props;
  const { visible } = useSchemaSettings();
  const firstVisible = useRef<boolean>(false);
  useEffect(() => {
    if (visible) {
      firstVisible.current = true;
    }
  }, [visible]);

  if (!visible && !firstVisible.current) return null;
  if (!children || children.length === 0) return null;
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item) => {
          // 当动态切换 SchemaSettings 列表时，切换前和切换后的 item.name 可能相同，导致 key 相同，从而导致 React 认为其前后是同一个组件；
          // 因为 SchemaSettingsChild 的某些 hooks 是通过 props 传入的，两次渲染之间 props 可能发生变化，就可能报 hooks 调用
          // 顺序的错误。所以这里使用一个随机值作为 key，保证每次渲染都是新的组件。
          return <SchemaSettingsChild key={uid()} {...item} />;
        })}
    </>
  );
};

const useChildrenDefault = () => undefined;
const useComponentPropsDefault = () => undefined;
const useVisibleDefault = () => true;
export const SchemaSettingsChild: FC<SchemaSettingsItemType> = (props) => {
  const {
    useVisible = useVisibleDefault,
    useChildren = useChildrenDefault,
    useComponentProps = useComponentPropsDefault,
    type,
    Component,
    children,
    hideIfNoChildren = true,
    componentProps,
  } = props as any;
  const useChildrenRes = useChildren();
  const useComponentPropsRes = useComponentProps();
  const findComponent = useFindComponent();
  const componentChildren = useChildrenRes || children;
  const visibleResult = useVisible();
  const ComponentValue = useMemo(() => {
    return !Component && type && typeComponentMap[type] ? typeComponentMap[type] : Component;
  }, [type, Component]);

  if (!visibleResult) return null;
  if (!type && !Component) return null;

  const C = findComponent(ComponentValue);
  if (!C) {
    return null;
  }
  if (hideIfNoChildren && Array.isArray(componentChildren) && componentChildren.length === 0) {
    return null;
  }

  return (
    <SchemaSettingItemContext.Provider value={props}>
      <C {...componentProps} {...useComponentPropsRes}>
        {Array.isArray(componentChildren) && componentChildren.length > 0 && (
          <SchemaSettingsChildren>{componentChildren}</SchemaSettingsChildren>
        )}
      </C>
    </SchemaSettingItemContext.Provider>
  );
};
