/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Dropdown, DropdownProps, Input, Menu, Spin, Empty } from 'antd';
import React, { useEffect, useState, useMemo, useRef } from 'react';

/**
 * 通过鼠标的位置计算出最佳的 dropdown 的高度，以尽量避免出现滚动条
 * @param deps 类似于 useEffect 的第二个参数，如果不传则默认为 []
 */
const useNiceDropdownMaxHeight = (deps: any[] = []) => {
  const heightRef = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const { clientY } = e;
      const h = Math.max(clientY, window.innerHeight - clientY);
      heightRef.current = h;
    };

    window.addEventListener('mousemove', handler);

    return () => {
      window.removeEventListener('mousemove', handler);
    };
  }, []);

  return useMemo(() => heightRef.current - 40, deps);
};

// 菜单项类型定义
export type Item = {
  key?: string;
  type?: 'group' | 'divider';
  label?: React.ReactNode;
  children?: Item[] | (() => Item[] | Promise<Item[]>);
  searchable?: boolean; // group 是否支持搜索
  searchPlaceholder?: string; // 搜索占位符
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
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const dropdownMaxHeight = useNiceDropdownMaxHeight([menuVisible]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器，避免内存泄露
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        let groupChildren = children ? resolveItems(children, [...path, item.key]) : [];

        // 如果 group 启用了搜索功能，在 children 前面添加搜索框
        if (item.searchable && children) {
          const searchKey = keyPath;
          const currentSearchValue = searchValues[searchKey] || '';

          // 过滤原始 children
          const filteredChildren = currentSearchValue
            ? children.filter(
                (child) => child.label?.toString().toLowerCase().includes(currentSearchValue.toLowerCase()),
              )
            : children;

          // 重新解析过滤后的 children
          const resolvedFilteredChildren = resolveItems(filteredChildren, [...path, item.key]);

          // 创建搜索框项
          const searchItem = {
            key: `${item.key}-search`,
            label: (
              <div>
                <Input
                  variant="borderless"
                  allowClear
                  placeholder={item.searchPlaceholder || 'search'}
                  value={currentSearchValue}
                  onChange={(e) => {
                    e.stopPropagation();
                    setIsSearching(true);
                    setSearchValues((prev) => ({
                      ...prev,
                      [searchKey]: e.target.value,
                    }));
                    // 清理之前的定时器
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    // 搜索完成后重置搜索状态
                    searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 300);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  size="small"
                  style={{
                    width: '100%',
                    paddingLeft: 0,
                    paddingRight: 0,
                  }}
                />
              </div>
            ),
            disabled: true, // 搜索项不可点击
          };

          // 创建分割线项
          const dividerItem = {
            key: `${item.key}-search-divider`,
            type: 'divider' as const,
          };

          // 如果搜索后没有结果，显示 Empty
          if (currentSearchValue && resolvedFilteredChildren.length === 0) {
            const emptyItem = {
              key: `${item.key}-empty`,
              label: (
                <div style={{ padding: '16px', textAlign: 'center' as const }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Data" style={{ margin: 0 }} />
                </div>
              ),
              disabled: true,
            };
            groupChildren = [searchItem, dividerItem, emptyItem];
          } else {
            groupChildren = [searchItem, dividerItem, ...resolvedFilteredChildren];
          }
        }

        return {
          type: 'group',
          key: item.key,
          label: item.label,
          children: groupChildren,
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
      open={menuVisible}
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
            style={{
              maxHeight: dropdownMaxHeight,
              overflowY: 'auto',
            }}
          />
        ) : (
          <Menu
            {...menu}
            onClick={() => {}}
            items={resolveItems(rootItems)}
            style={{
              maxHeight: dropdownMaxHeight,
              overflowY: 'auto',
              ...menu?.style,
            }}
          />
        )
      }
      onOpenChange={(visible) => {
        // 如果正在搜索且菜单要关闭，阻止关闭
        if (!visible && isSearching) {
          return;
        }
        setMenuVisible(visible);
      }}
    >
      {props.children}
    </Dropdown>
  );
};

export default LazyDropdown;
