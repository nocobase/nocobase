/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect, useMemo, useRef } from 'react';

import _ from 'lodash';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useFieldComponentName } from '../../../common/useFieldComponentName';
import { ErrorFallback, useFindComponent } from '../../../schema-component';
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
import { SchemaSettingItemContext } from '../context/SchemaSettingItemContext';
import { SchemaSettingsItemType } from '../types';

export interface SchemaSettingsChildrenProps {
  children: SchemaSettingsItemType[];
}

const SchemaSettingsChildErrorFallback: FC<
  FallbackProps & {
    title: string;
  }
> = (props) => {
  const { title, ...fallbackProps } = props;
  return (
    <SchemaSettingsItem title={title}>
      <ErrorFallback.Modal {...fallbackProps} />
    </SchemaSettingsItem>
  );
};

const getFallbackComponent = _.memoize((key: string) => {
  return (props) => <SchemaSettingsChildErrorFallback {...props} title={key} />;
});

export const SchemaSettingsChildren: FC<SchemaSettingsChildrenProps> = (props) => {
  const { children } = props;
  const { visible } = useSchemaSettings();
  const firstVisible = useRef<boolean>(false);
  const fieldComponentName = useFieldComponentName();

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
          // 当动态切换 SchemaSettings 列表时（比如切换 field component 时，列表会动态变化），切换前和切换后的 item.name 可能相同，
          // 此时如果使用 item.name 作为 key，会导致 React 认为其前后是同一个组件；因为 SchemaSettingsChild 的某些 hooks 是通过 props 传入的，
          // 两次渲染之间 props 可能发生变化，就可能报 hooks 调用顺序的错误。所以这里使用 fieldComponentName 和 item.name 拼成
          // 一个不会重复的 key，保证每次渲染都是新的组件。
          const key = `${fieldComponentName ? fieldComponentName + '-' : ''}${item?.name}`;
          return (
            <ErrorBoundary key={key} FallbackComponent={getFallbackComponent(key)} onError={console.log}>
              <SchemaSettingsChild {...item} />
            </ErrorBoundary>
          );
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
    hideIfNoChildren,
    componentProps,
  } = props as any;
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
  const useChildrenRes = useChildren();
  const useComponentPropsRes = useComponentProps();
  const findComponent = useFindComponent();
  const componentChildren = useMemo(() => {
    const res = [...(useChildrenRes || []), ...(children || [])];
    return res.length === 0 ? undefined : res;
  }, [useChildrenRes, children]);
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
  if (hideIfNoChildren && !componentChildren) {
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
