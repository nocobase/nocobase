/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, memo, useMemo } from 'react';

import { useFindComponent } from '../../../schema-component';
import { SchemaInitializerItemContext } from '../context';
import { SchemaInitializerItemType } from '../types';
export const SchemaInitializerChildren: FC<{ children: SchemaInitializerItemType[] }> = (props) => {
  const { children } = props;
  if (!children) return null;
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item, index) => (
          <SchemaInitializerChild key={item.name || (item as any).key || index} {...item} />
        ))}
    </>
  );
};

const typeComponentMap: Record<string, string> = {
  item: 'SchemaInitializerItemInternal',
  itemGroup: 'SchemaInitializerItemGroupInternal',
  divider: 'SchemaInitializerDivider',
  switch: 'SchemaInitializerSwitchInternal',
  subMenu: 'SchemaInitializerSubMenuInternal',
  actionModal: 'SchemaInitializerActionModalInternal',
};

const useChildrenDefault = () => undefined;
const useVisibleDefault = () => true;
const useComponentPropsDefault = () => undefined;
export const SchemaInitializerChild: FC<SchemaInitializerItemType> = memo((props) => {
  const {
    type,
    Component,
    component,
    children,
    useVisible = useVisibleDefault,
    useChildren = useChildrenDefault,
    useComponentProps = useComponentPropsDefault,
    hideIfNoChildren,
    componentProps,
    sort: _unUse,
    ...others
  } = props as any;
  const useChildrenRes = useChildren();
  const useComponentPropsRes = useComponentProps();
  const findComponent = useFindComponent();
  // 以前的参数是小写 `component`，新的是大写 `Component`，这里做一个兼容
  const componentVal = Component || component;
  const isBuiltType = !componentVal && type && typeComponentMap[type];

  const componentChildren = useMemo(() => {
    const res = [...(useChildrenRes || []), ...(children || [])];
    return res.length === 0 ? undefined : res;
  }, [useChildrenRes, children]);
  const contextValue = useMemo(() => {
    return {
      ...others,
      ...(isBuiltType ? useComponentPropsRes : {}),
      ...(isBuiltType ? componentProps : {}),
      children: componentChildren,
    };
  }, [others, isBuiltType, useComponentPropsRes, componentProps, componentChildren]);
  const visibleResult = useVisible();

  if (!visibleResult) return null;
  if (!type && !componentVal) return null;

  const C = findComponent(isBuiltType ? typeComponentMap[type] : componentVal);
  if (!C) {
    return null;
  }
  if (hideIfNoChildren && !componentChildren) {
    return null;
  }

  return (
    <SchemaInitializerItemContext.Provider value={contextValue}>
      <C {...componentProps} {...useComponentPropsRes}>
        {componentChildren}
      </C>
    </SchemaInitializerItemContext.Provider>
  );
});
SchemaInitializerChild.displayName = 'SchemaInitializerChild';
