import React, { ReactNode, useCallback } from 'react';
import { SchemaInitializerChild } from '../components';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerItemType } from '../types';

export function useSchemaInitializerMenuItems(items: any[], name?: string, onClick?: (args: any) => void) {
  const compile = useCompile();

  const getMenuItems = useCallback(
    (items: SchemaInitializerItemType[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item: any, indexA) => {
        const ItemComponent = item.component || item.Component;
        let element: ReactNode;
        const compiledTitle = item.title ? compile(item.title) : undefined;
        if (ItemComponent) {
          element = React.createElement(SchemaInitializerChild, { ...item, title: compiledTitle });
          if (!element) return;
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
            title: compiledTitle,
            label: element,
          };
        }
        if (item.type === 'itemGroup') {
          const label = typeof item.title === 'string' ? compiledTitle : item.title;
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
          const label = compiledTitle;
          const key = `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            title: label,
            children: item?.children.length ? getMenuItems(item.children, key) : [],
          };
        }

        const label = element || compiledTitle;
        const key = `${parentKey}-${item.title}-${indexA}`;
        return {
          key,
          label,
          title: compiledTitle,
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

  return getMenuItems(items, name);
}
