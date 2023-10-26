import React, { ComponentType, ReactNode, useCallback } from 'react';
import { SchemaInitializerItemType, SchemaInitializerOptions } from '../types';
import { useFindComponent } from '../../../schema-component';
import {
  SchemaInitializerGroup,
  SchemaInitializerMenu,
  SchemaInitializerItem,
  SchemaInitializerDivider,
} from '../components';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerItemOptions } from '../../../schema-initializer';

const typeComponentMap: Record<SchemaInitializerItemType['type'], ComponentType<any>> = {
  itemGroup: SchemaInitializerGroup,
  divider: SchemaInitializerDivider,
  subMenu: SchemaInitializerMenu,
  item: SchemaInitializerItem,
};
export const useInitializerComponent = () => {
  const findComponent = useFindComponent();
  function findInitializerComponent(
    type: SchemaInitializerItemType['type'],
    Component: SchemaInitializerItemType['Component'],
    useVisible: SchemaInitializerItemType['useVisible'],
  ) {
    if (!type && !Component) return null;
    const C = !Component && type && typeComponentMap[type] ? typeComponentMap[type] : findComponent(Component);
    if (!C) return null;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const visibleResult = useVisible?.(); // 运行时 hook 执行顺序可以保证，因为 load 阶段已经完成全部 items 的加载，所以这里可以直接使用
    if (useVisible && !visibleResult) return null;
    return C;
  }

  return findInitializerComponent;
};

export type UseInitializerChildrenResult = Omit<SchemaInitializerItemType, 'sort' | 'type' | 'visible'>;

export const useInitializerChildren = (children: SchemaInitializerOptions['list']): UseInitializerChildrenResult[] => {
  const findInitializerComponent = useInitializerComponent();
  return children
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((item) => {
      const { sort: _unUse, type, Component, component, useVisible, ...others } = item;
      return {
        Component: findInitializerComponent(type, Component || component, useVisible),
        item,
        ...others,
      };
    })
    .filter((item) => item.Component);
};

export function useSchemaInitializerMenuItems(
  items: SchemaInitializerItemOptions[],
  name?: string,
  onClick?: (args: any) => void,
) {
  const compile = useCompile();
  const findComponent = useFindComponent();

  const getMenuItems = useCallback(
    (items: SchemaInitializerItemOptions[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item, indexA) => {
        const ItemComponent = (item as any).component || (item as any).Component;
        let element: ReactNode;
        if (ItemComponent) {
          const Component = findComponent(ItemComponent);
          if (!Component) {
            console.error(`SchemaInitializer: component "${ItemComponent}" not found`);
            return null;
          }
          element = React.createElement(Component, { ...item, title: compile((item as any).title), item });
        }

        if (item.type === 'divider') {
          return { type: 'divider', key: `divider-${indexA}` };
        }
        if (item.type === 'item' && ItemComponent) {
          if (!item.key) {
            item.key = `${item.title}-${indexA}`;
          }
          return {
            key: item.key,
            title: compile(item.title),
            label: element,
          };
        }
        if (item.type === 'itemGroup') {
          const label = typeof item.title === 'string' ? compile(item.title) : item.title;
          const key = `${parentKey}-item-group-${indexA}`;
          return {
            type: 'group',
            key,
            label,
            title: label,
            // className: styles.nbMenuItemGroup,
            children: item?.children.length ? getMenuItems(item.children, key) : [],
          };
        }
        if (item.type === 'subMenu') {
          const label = compile(item.title);
          const key = `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            title: label,
            children: item?.children.length ? getMenuItems(item.children, key) : [],
          };
        }

        const label = element || compile(item.title);
        const key = `${parentKey}-${item.title}-${indexA}`;
        return {
          key,
          label,
          title: compile(item.title),
          onClick: (info) => {
            if (info.key !== key) return;
            if (item.onClick) {
              item.onClick({ ...info, item });
            } else {
              onClick?.({ ...info, item });
            }
          },
        };
      });
    },
    [compile, findComponent, onClick],
  );

  return getMenuItems(items, name);
}
