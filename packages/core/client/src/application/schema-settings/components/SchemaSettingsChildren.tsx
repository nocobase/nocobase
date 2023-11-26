import React, { FC, useMemo, useRef, useEffect } from 'react';

import { useFindComponent } from '../../../schema-component';
import { SchemaSettingsItemType } from '../types';
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
        .map((item) => (
          <SchemaSettingsChild key={item.name} {...item} />
        ))}
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
    checkChildrenLength,
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
  if (checkChildrenLength && Array.isArray(componentChildren) && componentChildren.length === 0) {
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
