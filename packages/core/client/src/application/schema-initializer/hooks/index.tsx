import React, { ComponentType, useCallback } from 'react';
import { createContext } from 'react';
import { InsertType, SchemaInitializerItemType, SchemaInitializerOptions } from '../types';
import { useFindComponent } from '../../../schema-component';
import { InitializerGroup, InitializerMenu, InitializerItem, InitializerDivider } from '../components';
import { useStyles } from '../components/style';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerItemOptions } from '../../../schema-initializer';

export const SchemaInitializerV2Context = createContext<{ insert: InsertType; options: SchemaInitializerOptions }>(
  {} as any,
);
SchemaInitializerV2Context.displayName = 'SchemaInitializerV2Context';
export const useSchemaInitializerV2 = () => {
  return React.useContext(SchemaInitializerV2Context);
};

const typeComponentMap: Record<SchemaInitializerItemType['type'], ComponentType> = {
  itemGroup: InitializerGroup,
  divider: InitializerDivider,
  subMenu: InitializerMenu,
  item: InitializerItem,
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
      const { sort: _unUse, type, Component, useVisible, ...others } = item;
      return {
        Component: findInitializerComponent(type, Component, useVisible),
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
  const { styles } = useStyles();
  const findComponent = useFindComponent();

  const getMenuItems = useCallback(
    (items: SchemaInitializerItemOptions[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item, indexA) => {
        if (item.type === 'divider') {
          return { type: 'divider', key: `divider-${indexA}` };
        }
        if (item.type === 'item' && item.component) {
          const Component = findComponent(item.component);
          if (!Component) {
            console.error(`SchemaInitializer: component "${item.component}" not found`);
            return null;
          }
          if (!item.key) {
            item.key = `${item.title}-${indexA}`;
          }
          return {
            key: item.key,
            title: item.title,
            label: (
              <Component
                {...item}
                item={{
                  ...item,
                  title: compile(item.title),
                }}
              />
            ),
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
            className: styles.nbMenuItemGroup,
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
        const label = compile(item.title);
        const key = `${parentKey}-${item.title}-${indexA}`;
        return {
          key,
          label,
          title: label,
          onClick: (info) => {
            if (info.key !== key) return;
            if (item.onClick) {
              item.onClick({ ...info, item });
            } else {
              onClick({ ...info, item });
            }
          },
        };
      });
    },
    [compile, onClick, styles.nbMenuItemGroup],
  );

  return getMenuItems(items, name);
}
