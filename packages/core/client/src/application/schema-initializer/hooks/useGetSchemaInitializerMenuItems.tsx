/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ReactNode, useCallback, useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerChild } from '../components';

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
        }

        if (item.type === 'divider') {
          return { type: 'divider', key: item.key || `divider-${indexA}` };
        }
        if (item.type === 'item' && ItemComponent) {
          if (!item.key) {
            item.key = `${compiledTitle}-${indexA}`;
          }
          return item.associationField
            ? {
                key: item.key,
                label: element,
                associationField: item.associationField,
              }
            : {
                key: item.key,
                label: element,
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
            children: item?.children?.length ? getMenuItems(item.children, key) : [],
          };
        }
        if (item.type === 'subMenu') {
          const label = compiledTitle;
          const key = item.key || item.name || `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            children: item?.children?.length ? getMenuItems(item.children, key) : [],
          };
        }
        if (item.isMenuType) {
          const { isMenuType, ...menuData } = item;
          return menuData;
        }

        const label = element || compiledTitle;
        const key = item.key || `${parentKey}-${compiledTitle}-${indexA}`;
        const handleClick = (info) => {
          info.domEvent.stopPropagation();
          if (info.key !== key) return;
          if (item.onClick) {
            item.onClick({ ...info, item });
          } else {
            onClick?.({ ...info, item });
          }
        };

        return item.associationField
          ? {
              key,
              label,
              associationField: item.associationField,
              onClick: handleClick,
            }
          : {
              style: item.style,
              key,
              label,
              onClick: handleClick,
            };
      });
    },
    [compile, onClick],
  );

  return getMenuItems;
}
