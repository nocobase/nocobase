import { error } from '@nocobase/utils/client';
import { ItemType } from 'antd/es/menu/hooks/useItems';
import React, { createContext, useCallback, useContext, useRef } from 'react';

type menuItemsKey = 'version' | 'profile' | 'password' | 'role' | 'language' | 'cache' | 'reboot' | 'signout';

interface OptionsOfAddMenuItem {
  before?: menuItemsKey;
  after?: menuItemsKey;
}

type Item = ItemType & { _options?: OptionsOfAddMenuItem };

const CurrentUserSettingsMenuContext = createContext<{ menuItems: React.MutableRefObject<Item[]> }>(null);

export const useCurrentUserSettingsMenu = () => {
  const { menuItems } = useContext(CurrentUserSettingsMenuContext) || {};

  const getMenuItems = useCallback(() => {
    return menuItems.current;
  }, []);
  const addMenuItem = useCallback((item: Item, options?: OptionsOfAddMenuItem) => {
    if (options) {
      item._options = options;
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
  }, []);

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

  return (
    <CurrentUserSettingsMenuContext.Provider value={{ menuItems }}>{children}</CurrentUserSettingsMenuContext.Provider>
  );
};
