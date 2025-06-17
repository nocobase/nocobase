/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Dropdown, DropdownProps, Menu, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

// 菜单项类型定义
export type Item = {
  key?: string;
  type?: 'group' | 'divider'; // 支持 group 类型
  label?: React.ReactNode;
  children?: Item[] | (() => Item[] | Promise<Item[]>);
  [key: string]: any; // 允许其他属性
};

export type ItemsType = Item[] | (() => Item[] | Promise<Item[]>);

interface LazyDropdownMenuProps extends Omit<DropdownProps['menu'], 'items'> {
  items: ItemsType;
}

const LazyDropdown: React.FC<Omit<DropdownProps, 'menu'> & { menu: LazyDropdownMenuProps }> = ({ menu, ...props }) => {
  const [loadedChildren, setLoadedChildren] = useState<Record<string, Item[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [rootItems, setRootItems] = useState<Item[]>([]);
  const [rootLoading, setRootLoading] = useState(false);

  const getKeyPath = (path: string[], key: string) => [...path, key].join('/');

  const handleLoadChildren = async (keyPath: string, loader: () => Item[] | Promise<Item[]>) => {
    if (loadedChildren[keyPath] || loadingKeys.has(keyPath)) return;

    setLoadingKeys((prev) => new Set(prev).add(keyPath));
    try {
      const children = loader();
      const resolved = children instanceof Promise ? await children : children;
      setLoadedChildren((prev) => ({ ...prev, [keyPath]: resolved }));
    } catch (err) {
      console.error(`Failed to load children for ${keyPath}`, err);
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(keyPath);
        return next;
      });
    }
  };

  // 收集所有异步 group
  const collectAsyncGroups = (items: Item[], path: string[] = []): [string, () => Item[] | Promise<Item[]>][] => {
    const result: [string, () => Item[] | Promise<Item[]>][] = [];
    for (const item of items) {
      const keyPath = getKeyPath(path, item.key);
      if (item.type === 'group' && typeof item.children === 'function') {
        result.push([keyPath, item.children]);
      }
      if (Array.isArray(item.children)) {
        result.push(...collectAsyncGroups(item.children, [...path, item.key]));
      }
    }
    return result;
  };

  // 加载根 items，支持同步/异步函数
  useEffect(() => {
    const loadRootItems = async () => {
      let items: Item[];
      if (typeof menu.items === 'function') {
        setRootLoading(true);
        try {
          const res = menu.items();
          items = res instanceof Promise ? await res : res;
        } finally {
          setRootLoading(false);
        }
      } else {
        items = menu.items;
      }
      setRootItems(items);
    };

    if (menuVisible) {
      loadRootItems();
    }
  }, [menu.items, menuVisible]);

  // 自动加载所有 group 的异步 children
  useEffect(() => {
    if (!menuVisible || !rootItems.length) return;
    const asyncGroups = collectAsyncGroups(rootItems);
    for (const [keyPath, loader] of asyncGroups) {
      if (!loadedChildren[keyPath] && !loadingKeys.has(keyPath)) {
        handleLoadChildren(keyPath, loader);
      }
    }
  }, [menuVisible, rootItems]);

  // 递归解析 items，支持 children 为同步/异步函数
  const resolveItems = (items: Item[], path: string[] = []): any[] => {
    return items.map((item) => {
      const keyPath = getKeyPath(path, item.key);
      const isGroup = item.type === 'group';
      const hasAsyncChildren = typeof item.children === 'function';
      const isLoading = loadingKeys.has(keyPath);
      const loaded = loadedChildren[keyPath];

      // 非 group 的异步 children，鼠标悬浮时加载
      const shouldLoadChildren =
        !isGroup && menuVisible && openKeys.has(keyPath) && hasAsyncChildren && !loaded && !isLoading;

      if (shouldLoadChildren) {
        handleLoadChildren(keyPath, item.children as () => Item[] | Promise<Item[]>);
      }

      let children: Item[] | undefined;
      if (hasAsyncChildren) {
        children = loaded ?? [];
      } else if (Array.isArray(item.children)) {
        children = item.children;
      }

      if (hasAsyncChildren && !loaded) {
        children = [
          {
            key: `${keyPath}-loading`,
            label: <Spin size="small" />,
            disabled: true,
          } as Item,
        ];
      }

      if (isGroup) {
        return {
          type: 'group',
          key: item.key,
          label: item.label,
          children: children ? resolveItems(children, [...path, item.key]) : [],
        };
      }

      if (item.type === 'divider') {
        return { type: 'divider', key: item.key };
      }

      return {
        key: item.key,
        label: item.label,
        onClick: (info) => {
          if (children) {
            return;
          }
          menu.onClick?.({
            ...info,
            originalItem: item,
          } as any); // 👈 强制扩展类型
        },
        onMouseEnter: () => {
          setOpenKeys((prev) => {
            if (prev.has(keyPath)) return prev;
            const next = new Set(prev);
            next.add(keyPath);
            return next;
          });
        },
        children: children && children.length > 0 ? resolveItems(children, [...path, item.key]) : undefined,
      };
    });
  };

  return (
    <Dropdown
      {...props}
      dropdownRender={() =>
        rootLoading && rootItems.length === 0 ? (
          <Menu
            items={[
              {
                key: `root-loading`,
                label: <Spin size="small" />,
                disabled: true,
              },
            ]}
          />
        ) : (
          <Menu {...menu} onClick={() => {}} items={resolveItems(rootItems)} />
        )
      }
      onOpenChange={(visible) => setMenuVisible(visible)}
    >
      {props.children}
    </Dropdown>
  );
};

export default LazyDropdown;
