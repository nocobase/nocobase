/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { error } from '@nocobase/utils/client';
import { ItemType } from 'antd/es/menu/interface';
import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

type menuItemsKey =
  | 'version'
  | 'profile'
  | 'password'
  | 'role'
  | 'language'
  | 'cache'
  | 'reboot'
  | 'signout'
  | 'divider_1'
  | 'divider_2'
  | 'divider_3'
  | 'divider_4';

interface OptionsOfAddMenuItem {
  before?: menuItemsKey;
  after?: menuItemsKey;
}

type Item = ItemType & { _options?: OptionsOfAddMenuItem };

const CurrentUserSettingsMenuContext = createContext<{ menuItems: React.MutableRefObject<Item[]> }>(null);
CurrentUserSettingsMenuContext.displayName = 'CurrentUserSettingsMenuContext';

export const useCurrentUserSettingsMenu = () => {
  const { menuItems } = useContext(CurrentUserSettingsMenuContext) || {};

  const getMenuItems = useCallback(() => {
    return menuItems.current;
  }, [menuItems]);
  const addMenuItem = useCallback(
    (item: Item, options?: OptionsOfAddMenuItem) => {
      let index;
      if (options) {
        item._options = options;
      }
      // 防止重复添加
      if ((index = menuItems.current.findIndex((i) => i.key === item.key)) !== -1) {
        menuItems.current[index] = item;
        menuItems.current = [...menuItems.current];
        return;
      }

      if (options) {
        if (options.before) {
          const index = menuItems.current.findIndex((item) => item.key === options.before);
          menuItems.current.splice(index, 0, item);
          return;
        }
        if (options.after) {
          const index = menuItems.current.findIndex((item) => item.key === options.after);
          menuItems.current.splice(index + 1, 0, item);
          return;
        }
      }

      const oldItems = menuItems.current;

      menuItems.current = oldItems.filter(
        (oldItem) => item.key !== oldItem._options?.before && item.key !== oldItem._options?.after,
      );
      menuItems.current.push(...oldItems.filter((oldItem) => oldItem._options?.before === item.key));
      menuItems.current.push(item);
      menuItems.current.push(...oldItems.filter((oldItem) => oldItem._options?.after === item.key));
    },
    [menuItems],
  );

  if (!menuItems) {
    error('CurrentUser: You should use `CurrentUserSettingsMenuProvider` in the root of your app.');
    throw new Error('CurrentUser: You should use `CurrentUserSettingsMenuProvider` in the root of your app.');
  }

  return { getMenuItems, addMenuItem };
};

/**
 * 为整个 App 提供一个 `menuItems` 的 Ref 对象，用于在 `插件` 中添加菜单项
 */
export const CurrentUserSettingsMenuProvider = ({ children }) => {
  const menuItems = useRef<ItemType[]>([]);
  const value = useMemo(() => ({ menuItems }), [menuItems]);
  return <CurrentUserSettingsMenuContext.Provider value={value}>{children}</CurrentUserSettingsMenuContext.Provider>;
};
