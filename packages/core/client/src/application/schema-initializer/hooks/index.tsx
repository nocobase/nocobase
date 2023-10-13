import React, { ComponentType } from 'react';
import { createContext } from 'react';
import { InsertType, SchemaInitializerListItemType, SchemaInitializerOptions } from '../types';
import { useFindComponent } from '../../../schema-component';
import { InitializerGroup, InitializerMenu, InitializerItem, InitializerDivider } from '../components';

export const SchemaInitializerV2Context = createContext<{ insert: InsertType }>({} as any);
SchemaInitializerV2Context.displayName = 'SchemaInitializerV2Context';
export const useSchemaInitializerV2 = () => {
  return React.useContext(SchemaInitializerV2Context);
};

const typeComponentMap: Record<SchemaInitializerListItemType['type'], ComponentType> = {
  itemGroup: InitializerGroup,
  divider: InitializerDivider,
  subMenu: InitializerMenu,
  itemMenu: undefined,
  item: InitializerItem,
};
export const useInitializerComponent = () => {
  const findComponent = useFindComponent();
  function findInitializerComponent(
    type: SchemaInitializerListItemType['type'],
    Component: SchemaInitializerListItemType['Component'],
    visible: SchemaInitializerListItemType['visible'],
  ) {
    if (!type && !Component) return null;
    const C = !Component && type && typeComponentMap[type] ? typeComponentMap[type] : findComponent(Component);
    if (!C) return null;
    const visibleResult = visible?.();
    if (visible && !visibleResult) return null;
    return C;
  }

  return findInitializerComponent;
};

export type UseInitializerChildrenResult = Omit<SchemaInitializerListItemType, 'sort' | 'type' | 'visible'>;

export const isComponentChildren = (val: unknown): val is ComponentType => {
  return !Array.isArray(val);
};

export const useInitializerChildren = (
  children: SchemaInitializerOptions['list'],
): UseInitializerChildrenResult[] | ComponentType => {
  const findInitializerComponent = useInitializerComponent();
  if (isComponentChildren(children)) return children;
  return children
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((item) => {
      const { sort: _unUse, type, Component, visible, ...others } = item;
      return {
        Component: findInitializerComponent(type, Component, visible),
        item,
        ...others,
      };
    })
    .filter((item) => item.Component);
};
