/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Dropdown, DropdownProps, Empty, Input, InputProps, Spin } from 'antd';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useFlowModel } from '../../hooks';
import { useFlowEngine } from '../../provider';

// ==================== Types ====================

export type Item = {
  key?: string;
  type?: 'group' | 'divider';
  label?: React.ReactNode;
  children?: Item[] | (() => Item[] | Promise<Item[]>);
  searchable?: boolean;
  searchPlaceholder?: string;
  [key: string]: any;
};

export type ItemsType = Item[] | (() => Item[] | Promise<Item[]>);

interface LazyDropdownMenuProps extends Omit<DropdownProps['menu'], 'items'> {
  items: ItemsType;
}

// ==================== Custom Hooks ====================

/**
 * 计算合适的下拉菜单最大高度
 */
const useNiceDropdownMaxHeight = () => {
  return useMemo(() => {
    const maxHeight = Math.min(window.innerHeight * 0.6, 400);
    return maxHeight;
  }, []);
};

/**
 * 处理异步菜单项加载的逻辑
 */
const useAsyncMenuItems = (menuVisible: boolean, rootItems: Item[]) => {
  const [loadedChildren, setLoadedChildren] = useState<Record<string, Item[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());

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

  return {
    loadedChildren,
    loadingKeys,
    handleLoadChildren,
  };
};

/**
 * 处理菜单搜索状态
 */
const useMenuSearch = () => {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateSearchValue = (key: string, value: string) => {
    setIsSearching(true);
    setSearchValues((prev) => ({ ...prev, [key]: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => setIsSearching(false), 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchValues,
    isSearching,
    updateSearchValue,
  };
};

/**
 * 处理动态子菜单样式
 */
const useSubmenuStyles = (menuVisible: boolean, dropdownMaxHeight: number) => {
  useEffect(() => {
    if (!menuVisible || dropdownMaxHeight <= 0) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            if (element.classList?.contains('ant-dropdown-menu-submenu-popup')) {
              requestAnimationFrame(() => {
                const menuContainer = element.querySelector('.ant-dropdown-menu');
                if (menuContainer) {
                  const container = menuContainer as HTMLElement;
                  container.style.maxHeight = `${dropdownMaxHeight}px`;
                  container.style.overflowY = 'auto';
                  container.classList.add('submenu-ready');
                }
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false,
    });

    const intervalId = setInterval(() => {
      const submenuPopups = document.querySelectorAll('.ant-dropdown-menu-submenu-popup .ant-dropdown-menu');
      submenuPopups.forEach((menu) => {
        const container = menu as HTMLElement;
        const rect = container.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0 && !container.classList.contains('submenu-ready')) {
          container.style.maxHeight = `${dropdownMaxHeight}px`;
          container.style.overflowY = 'auto';
          container.classList.add('submenu-ready');
        }
      });
    }, 200);

    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [menuVisible, dropdownMaxHeight]);
};

// ==================== Components ====================

/**
 * 使搜索输入框在显示下拉菜单时自动聚焦
 */
const SearchInputWithAutoFocus: FC<InputProps & { visible: boolean }> = (props) => {
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current && props.visible) {
      inputRef.current.input.focus();
    }
  }, [props.visible]);

  return <Input ref={inputRef} {...props} />;
};

// ==================== Utility Functions ====================

const getKeyPath = (path: string[], key: string) => [...path, key].join('/');

const createSearchItem = (
  item: Item,
  searchKey: string,
  currentSearchValue: string,
  menuVisible: boolean,
  t: (key: string) => string,
  updateSearchValue: (key: string, value: string) => void,
) => ({
  key: `${item.key}-search`,
  label: (
    <div>
      <SearchInputWithAutoFocus
        visible={menuVisible}
        variant="borderless"
        allowClear
        placeholder={t(item.searchPlaceholder || 'Search')}
        value={currentSearchValue}
        onChange={(e) => {
          e.stopPropagation();
          updateSearchValue(searchKey, e.target.value);
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
  disabled: true,
});

const createEmptyItem = (itemKey: string, t: (key: string) => string) => ({
  key: `${itemKey}-empty`,
  label: (
    <div style={{ padding: '16px', textAlign: 'center' as const }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} style={{ margin: 0 }} />
    </div>
  ),
  disabled: true,
});

// ==================== Main Component ====================

const LazyDropdown: React.FC<Omit<DropdownProps, 'menu'> & { menu: LazyDropdownMenuProps }> = ({ menu, ...props }) => {
  const engine = useFlowEngine();
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [rootItems, setRootItems] = useState<Item[]>([]);
  const [rootLoading, setRootLoading] = useState(false);
  const dropdownMaxHeight = useNiceDropdownMaxHeight();
  const t = engine.translate.bind(engine);

  // 使用自定义 hooks
  const { loadedChildren, loadingKeys, handleLoadChildren } = useAsyncMenuItems(menuVisible, rootItems);
  const { searchValues, isSearching, updateSearchValue } = useMenuSearch();
  useSubmenuStyles(menuVisible, dropdownMaxHeight);

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

          const searchItem = createSearchItem(item, searchKey, currentSearchValue, menuVisible, t, updateSearchValue);
          const dividerItem = { key: `${item.key}-search-divider`, type: 'divider' as const };

          if (currentSearchValue && resolvedFilteredChildren.length === 0) {
            const emptyItem = createEmptyItem(item.key, t);
            groupChildren = [searchItem, dividerItem, emptyItem];
          } else {
            groupChildren = [searchItem, dividerItem, ...resolvedFilteredChildren];
          }
        }

        return {
          type: 'group',
          key: item.key,
          label: typeof item.label === 'string' ? t(item.label) : item.label,
          children: groupChildren,
        };
      }

      if (item.type === 'divider') {
        return { type: 'divider', key: item.key };
      }

      return {
        key: item.key,
        label: typeof item.label === 'string' ? t(item.label) : item.label,
        onClick: (info: any) => {
          if (children) {
            return;
          }
          menu.onClick?.({
            ...info,
            originalItem: item,
          } as any);
        },
        onMouseEnter: () => {
          setOpenKeys((prev) => {
            if (prev.has(keyPath)) return prev;
            const next = new Set(prev);
            next.add(keyPath);
            return next;
          });
        },
        children:
          children && children.length > 0
            ? resolveItems(children, [...path, item.key])
            : children && children.length === 0
              ? [createEmptyItem(keyPath, t)]
              : undefined,
      };
    });
  };

  // 创建优化的 CSS 样式
  const overlayClassName = useMemo(() => {
    return css`
      .ant-dropdown-menu {
        max-height: ${dropdownMaxHeight}px;
        overflow-y: auto;
      }

      /* 子菜单初始状态：透明且准备好样式 */
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu {
        opacity: 0;
        max-height: ${dropdownMaxHeight}px !important;
        overflow-y: auto !important;
        transition: opacity 0.15s ease-in-out;
      }

      /* 样式设置完成后显示 */
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu.submenu-ready {
        opacity: 1;
      }

      /* 针对动态加载的深层菜单 */
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu-submenu-popup .ant-dropdown-menu {
        opacity: 0;
        max-height: ${dropdownMaxHeight}px !important;
        overflow-y: auto !important;
        transition: opacity 0.15s ease-in-out;
      }

      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu-submenu-popup .ant-dropdown-menu.submenu-ready {
        opacity: 1;
      }
    `;
  }, [dropdownMaxHeight]);

  return (
    <Dropdown
      {...props}
      open={menuVisible}
      destroyPopupOnHide
      overlayClassName={overlayClassName}
      placement="bottomLeft"
      menu={{
        ...menu,
        items:
          rootLoading && rootItems.length === 0
            ? [
                {
                  key: 'root-loading',
                  label: <Spin size="small" />,
                  disabled: true,
                },
              ]
            : resolveItems(rootItems),
        onClick: () => {},
        style: {
          maxHeight: dropdownMaxHeight,
          overflowY: 'auto',
          ...menu?.style,
        },
      }}
      onOpenChange={(visible) => {
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
