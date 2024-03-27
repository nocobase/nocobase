import { ButtonProps } from 'antd';
import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useApp } from '../../hooks';
import { SchemaInitializerChild, SchemaInitializerItems } from '../components';
import { SchemaInitializerButton } from '../components/SchemaInitializerButton';
import { withInitializer } from '../hoc';
import { SchemaInitializerOptions } from '../types';

export * from './useAriaAttributeOfMenuItem';

/**
 * @internal
 */
export function useSchemaInitializerMenuItems(items: any[], name?: string, onClick?: (args: any) => void) {
  const getMenuItems = useGetSchemaInitializerMenuItems(onClick);
  return useMemo(() => getMenuItems(items, name), [getMenuItems, items, name]);
}

/**
 * @internal
 */
export function useGetSchemaInitializerMenuItems(onClick?: (args: any) => void) {
  const compile = useCompile();

  const getMenuItems = useCallback(
    (items: any[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item: any, indexA) => {
        const ItemComponent = item.component || item.Component;
        let element: ReactNode;
        const compiledTitle = item.title || item.label ? compile(item.title || item.label) : undefined;
        if (ItemComponent) {
          element = React.createElement(SchemaInitializerChild, { ...item, title: compiledTitle });
          if (!element) return;
        }

        if (item.type === 'divider') {
          return { type: 'divider', key: item.key || `divider-${indexA}` };
        }
        if (item.type === 'item' && ItemComponent) {
          if (!item.key) {
            item.key = `${compiledTitle}-${indexA}`;
          }
          return {
            key: item.key,
            label: element,
            associationField: item.associationField,
          };
        }
        if (item.type === 'itemGroup') {
          const label = typeof compiledTitle === 'string' ? compiledTitle : item.title;
          const key = item.key || `${parentKey}-item-group-${indexA}`;
          return {
            type: 'group',
            key,
            label,
            // className: styles.nbMenuItemGroup,
            children: item?.children.length ? getMenuItems(item.children, key) : [],
          };
        }
        if (item.type === 'subMenu') {
          const label = compiledTitle;
          const key = item.key || item.name || `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            children: item?.children.length ? getMenuItems(item.children, key) : [],
          };
        }
        if (item.isMenuType) {
          const { isMenuType, ...menuData } = item;
          return menuData;
        }

        const label = element || compiledTitle || item.label;
        const key = item.key || `${parentKey}-${compiledTitle}-${indexA}`;
        return {
          key,
          label,
          associationField: item.associationField,
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
    [compile, onClick],
  );

  return getMenuItems;
}

const InitializerComponent: FC<SchemaInitializerOptions<any, any>> = React.memo((options) => {
  const Component: any = options.Component || SchemaInitializerButton;

  const ItemsComponent: any = options.ItemsComponent || SchemaInitializerItems;
  const itemsComponentProps: any = {
    ...options.itemsComponentProps,
    options,
    items: options.items,
    style: options.itemsComponentStyle,
  };

  const C = useMemo(() => withInitializer(Component), [Component]);

  return React.createElement(C, options, React.createElement(ItemsComponent, itemsComponentProps));
});
InitializerComponent.displayName = 'InitializerComponent';

export function useSchemaInitializerRender<P1 = ButtonProps, P2 = {}>(
  name: string,
  options?: Omit<SchemaInitializerOptions<P1, P2>, 'name'>,
) {
  const app = useApp();
  const renderCache = React.useRef<Record<string, React.FunctionComponentElement<any>>>({});
  const initializer = useMemo(
    () => app.schemaInitializerManager.get<P1, P2>(name),
    [app.schemaInitializerManager, name],
  );
  const res = useMemo(() => {
    if (!name) {
      return {
        exists: false,
        render: () => null,
      };
    }

    if (!initializer) {
      console.error(`[nocobase]: SchemaInitializer "${name}" not found`);
      return {
        exists: false,
        render: () => null,
      };
    }
    return {
      exists: true,
      render: (props?: Omit<SchemaInitializerOptions<P1, P2>, 'name'>) => {
        const key = JSON.stringify(props) || '{}';
        if (renderCache.current[key]) {
          return renderCache.current[key];
        }
        return (renderCache.current[key] = React.createElement(InitializerComponent, {
          ...initializer.options,
          ...options,
          ...props,
        }));
      },
    };
  }, [initializer, name, options]);

  return res;
}
