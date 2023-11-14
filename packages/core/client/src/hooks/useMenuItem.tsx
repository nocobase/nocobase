import { MenuProps } from 'antd';
import _ from 'lodash';
import React, { createContext, ReactNode, useCallback, useContext, useRef } from 'react';

type Item = MenuProps['items'][0] & {
  /** 在清空数组时，如果该字段为 true 则保留该选项 */
  notdelete?: boolean;
  /** 用于给列表排序 */
  order?: number;
};

export const GetMenuItemContext = createContext<{ collectMenuItem?(item: Item): void; onChange?: () => void }>(null);
export const GetMenuItemsContext = createContext<{ pushMenuItem?(item: Item): void }>(null);

/**
 * 用于为 SchemaInitializer.Item 组件提供一些方法，比如收集菜单项数据
 * @returns
 */
export const useCollectMenuItem = () => {
  return useContext(GetMenuItemContext) || {};
};

export const useCollectMenuItems = () => {
  return useContext(GetMenuItemsContext) || {};
};

/**
 * 用于在 antd 从 4.x 升级到 5.x 中，用于把 SchemaInitializer.Item 组件这种写法转换成 Menu 组件的 items 写法
 * @returns
 */
export const useMenuItem = () => {
  const list = useRef<any[]>([]);
  const renderItems = useRef<() => JSX.Element>(null);
  const shouldRerender = useRef(false);

  const Component = useCallback(({ limitCount }) => {
    if (!shouldRerender.current) {
      return null;
    }
    shouldRerender.current = false;

    if (renderItems.current) {
      return renderItems.current();
    }

    if (limitCount && list.current.length > limitCount) {
      return (
        <>
          {list.current.slice(0, limitCount).map((Com, index) => (
            <Com key={index} />
          ))}
        </>
      );
    }

    return (
      <>
        {list.current.map((Com, index) => (
          <Com key={index} />
        ))}
      </>
    );
  }, []);

  const getMenuItems = useCallback((Com: () => ReactNode): Item[] => {
    const items: Item[] = [];

    const pushMenuItem = (item: Item) => {
      items.push(item);
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    shouldRerender.current = true;
    renderItems.current = () => {
      const notDeleteItems = items.filter((item) => item.notdelete).map((item) => _.omit(item, 'notdelete') as Item);
      items.length = 0;
      items.push(...notDeleteItems);
      return (
        <GetMenuItemsContext.Provider
          value={{
            pushMenuItem,
          }}
        >
          {Com()}
        </GetMenuItemsContext.Provider>
      );
    };

    return items;
  }, []);

  const getMenuItem = useCallback((Com: () => JSX.Element): Item => {
    const item = {} as Item;

    const collectMenuItem = (menuItem: Item) => {
      Object.assign(item, menuItem);
    };

    shouldRerender.current = true;
    list.current.push(() => {
      return <GetMenuItemContext.Provider value={{ collectMenuItem }}>{Com()}</GetMenuItemContext.Provider>;
    });

    return item;
  }, []);

  // 防止 list 有重复元素
  const clean = useCallback(() => {
    list.current = [];
  }, []);

  return { Component, getMenuItems, getMenuItem, clean };
};
