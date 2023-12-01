import React, { FC, useMemo } from 'react';

import { SchemaInitializerItemType } from '../types';
import { SchemaInitializerItemContext } from '../context';
import { useFindComponent } from '../../../schema-component';
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
  subMenu: 'SchemaInitializerSubMenuInternal',
  actionModal: 'SchemaInitializerActionModalInternal',
};

const useChildrenDefault = () => undefined;
const useVisibleDefault = () => true;
const useComponentPropsDefault = () => undefined;
export const SchemaInitializerChild: FC<SchemaInitializerItemType> = (props) => {
  const {
    type,
    Component,
    component,
    children,
    useVisible = useVisibleDefault,
    useChildren = useChildrenDefault,
    useComponentProps = useComponentPropsDefault,
    checkChildrenLength,
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

  const componentChildren = useChildrenRes || children;
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
  if (checkChildrenLength && Array.isArray(componentChildren) && componentChildren.length === 0) {
    return null;
  }

  return (
    <SchemaInitializerItemContext.Provider value={contextValue}>
      <C {...componentProps} {...useComponentPropsRes}>
        {componentChildren}
      </C>
    </SchemaInitializerItemContext.Provider>
  );
};
