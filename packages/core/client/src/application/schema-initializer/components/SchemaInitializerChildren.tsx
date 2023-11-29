import React, { FC, useMemo } from 'react';

import { SchemaInitializerItemType } from '../types';
import { SchemaInitializerItemContext } from '../context';
import { useFindComponent } from '../../../schema-component';
export const SchemaInitializerChildren: FC<{ children: SchemaInitializerItemType[] }> = (props) => {
  const { children } = props;
  return (
    <>
      {children
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item, index) => (
          <SchemaInitializerChild key={item.name || item.key || index} {...item} />
        ))}
    </>
  );
};

const typeComponentMap: Record<SchemaInitializerItemType['type'], any> = {
  itemGroup: 'SchemaInitializerItemGroupInternal',
  divider: 'SchemaInitializerDivider',
  subMenu: 'SchemaInitializerSubMenuInternal',
  item: 'SchemaInitializerItemGroupInternal',
  actionModal: 'SchemaInitializerActionModalInternal',
};

const useChildrenDefault = () => undefined;
const useVisibleDefault = () => true;
export const SchemaInitializerChild: FC<SchemaInitializerItemType> = (props) => {
  const {
    type,
    Component,
    component,
    useVisible = useVisibleDefault,
    children,
    useChildren = useChildrenDefault,
    checkChildrenLength,
    componentProps,
    sort: _unUse,
    ...others
  } = props;
  const useChildrenRes = useChildren();
  const findComponent = useFindComponent();
  // 以前的参数是小写 `component`，新的是大写 `Component`，这里做一个兼容
  const componentVal = Component || component;

  const componentChildren = useChildrenRes || children;
  const contextValue = useMemo(() => {
    return {
      ...others,
      children: componentChildren,
    };
  }, [others, componentChildren]);
  const visibleResult = useVisible();

  if (!visibleResult) return null;
  if (!type && !componentVal) return null;

  const C = findComponent(!componentVal && type && typeComponentMap[type] ? typeComponentMap[type] : componentVal);
  if (!C) {
    return null;
  }
  if (checkChildrenLength && Array.isArray(componentChildren) && componentChildren.length === 0) {
    return null;
  }

  return (
    <SchemaInitializerItemContext.Provider value={contextValue}>
      <C {...componentProps}>{componentChildren}</C>
    </SchemaInitializerItemContext.Provider>
  );
};
