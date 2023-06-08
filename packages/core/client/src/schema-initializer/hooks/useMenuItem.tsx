import { MenuProps } from 'antd';
import React, { createContext, useCallback, useContext, useState } from 'react';

type Item = MenuProps['items'][0];

export const GetMenuItemContext = createContext<{ collectMenuItem?(item: Item): void; onChange?: () => void }>(null);

/**
 * 用于为 SchemaInitializer.Item 组件提供一些方法，比如收集菜单项数据
 * @returns
 */
export const useCollectMenuItem = () => {
  return useContext(GetMenuItemContext) || {};
};

/**
 * 用于在 antd 从 4.x 升级到 5.x 中，用于把 SchemaInitializer.Item 组件这种写法转换成 Menu 组件的 items 写法
 * @returns
 */
export const useMenuItem = () => {
  const [list, setList] = useState<any[]>([]);
  const [isChanged, setIsChanged] = useState(false);

  const Component = useCallback(() => {
    return (
      <>
        {list.map((Com, index) => (
          <Com key={index} />
        ))}
      </>
    );
  }, [list]);

  const getMenuItem = useCallback((Com: () => JSX.Element): Item => {
    const item = {} as Item;

    const collectMenuItem = (menuItem: Item) => {
      Object.assign(item, menuItem);
    };

    const onChange = () => {
      setIsChanged(true);
    };

    setList((prev) => {
      if (prev) {
        prev.push(() => {
          return (
            <GetMenuItemContext.Provider value={{ collectMenuItem, onChange }}>{Com()}</GetMenuItemContext.Provider>
          );
        });
        return prev;
      }
      return [];
    });

    return item;
  }, []);

  // 防止 list 有重复元素
  const clean = useCallback(() => {
    setList([]);
  }, []);

  /**
   * 当列表的状态发生变化时，需要返回一个新的列表，否则不会更新 UI
   */
  const cloneItemsWhenChanged = useCallback(
    (items: Item[]) => {
      if (isChanged) {
        setIsChanged(false);
        return [...items];
      }
      return items;
    },
    [isChanged],
  );

  return { Component, getMenuItem, clean, cloneItemsWhenChanged };
};
