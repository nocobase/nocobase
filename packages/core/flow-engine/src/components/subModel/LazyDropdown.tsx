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
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFlowEngine } from '../../provider';

// ==================== Types ====================

export type Item = {
  key?: string;
  type?: 'group' | 'divider';
  label?: React.ReactNode;
  children?: Item[] | (() => Item[] | Promise<Item[]>);
  searchable?: boolean;
  searchPlaceholder?: string;
  keepDropdownOpen?: boolean;
  /**
   * 开关状态标记（内部使用）
   */
  isToggled?: boolean;
  /**
   * 原始菜单项数据（内部使用）
   */
  originalItem?: any;
  /**
   * 是否为唯一项标记（内部使用）
   */
  unique?: boolean;
  [key: string]: any;
};

export type ItemsType = Item[] | (() => Item[] | Promise<Item[]>);

interface LazyDropdownMenuProps extends Omit<DropdownProps['menu'], 'items'> {
  items: ItemsType;
  keepDropdownOpen?: boolean;
  /**
   * 在父节点短暂重建（卸载/重挂载）时用于恢复打开状态的持久键。
   * 不需要手动传入，调用方（如 AddSubModelButton）会自动生成。
   */
  persistKey?: string;
  /**
   * 仅用于“状态刷新”的版本号。变化时会重新计算根 items，
   * 但不会清空已加载的 children，避免 UI 闪烁。
   */
  stateVersion?: number;
  /**
   * 额外刷新目标（多路径）：每条路径的祖先都会被刷新
   */
  refreshKeys?: string[];
}

interface ExtendedMenuInfo {
  key: string;
  keyPath: string[];
  item: any;
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
  originalItem: Item;
  keepDropdownOpen: boolean;
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
const useAsyncMenuItems = (
  menuVisible: boolean,
  rootItems: Item[],
  resetKey?: any,
  openKeySet?: Set<string>,
  refreshKeys?: string[],
) => {
  const [loadedChildren, setLoadedChildren] = useState<Record<string, Item[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  // 记录已处理过的 stateVersion，避免重复强制刷新
  const lastRefreshedVersion = useRef<any>(null);
  // 预取逻辑已移除：不再使用签名缓存

  const handleLoadChildren = useCallback(
    async (keyPath: string, loader: () => Item[] | Promise<Item[]>, force = false) => {
      // 若已在加载中，直接跳过，避免重复进入（即便是 force 情况也避免重入）
      if (loadingKeys.has(keyPath)) return;
      if (!force && loadedChildren[keyPath]) return;

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
    },
    [loadedChildren, loadingKeys],
  );

  // 收集所有“children 为函数”的节点（无论是否为 group），支持从 rootItems 与已加载的 loadedChildren 中同时收集。
  const collectAsyncNodes = (
    root: Item[],
    loaded: Record<string, Item[]>,
  ): [string, () => Item[] | Promise<Item[]>][] => {
    const result: [string, () => Item[] | Promise<Item[]>][] = [];
    const scan = (items: Item[], path: string[] = []) => {
      for (const item of items) {
        const keyPath = getKeyPath(path, item.key);
        if (typeof item.children === 'function') {
          result.push([keyPath, item.children]);
        }
        if (Array.isArray(item.children)) {
          scan(item.children, [...path, item.key]);
        }
      }
    };
    // 1) 扫描根
    scan(root, []);
    // 2) 扫描已加载的分支（保持 keyPath 前缀）
    for (const keyPath of Object.keys(loaded)) {
      const items = loaded[keyPath] || [];
      const parts = keyPath ? keyPath.split('/') : [];
      scan(items, parts);
    }
    return result;
  };

  // 当 resetKey（stateVersion）变化时，尽量“原位刷新”已加载的 children：
  // 1) 不清空 loadedChildren，避免 UI 闪烁；
  // 2) 仅对 children 为函数的节点强制后台刷新，刷新完成后无感替换。
  useEffect(() => {
    if (!menuVisible) return;
    // 避免同一 stateVersion 被重复刷新
    if (lastRefreshedVersion.current === resetKey) {
      return;
    }
    lastRefreshedVersion.current = resetKey;
    // 构建当前可用的 loader 索引表（keyPath -> loader）
    const loaderMap = new Map<string, () => Item[] | Promise<Item[]>>();
    for (const [kp, loader] of collectAsyncNodes(rootItems, loadedChildren)) {
      loaderMap.set(kp, loader);
    }
    // 仅刷新“当前展开”的分支，避免刷新未展开的所有分支导致的循环/卡顿
    const openKeys = openKeySet ? Array.from(openKeySet) : [];
    let targetKeys: string[] = [];
    const candidates = Array.from(new Set([...(refreshKeys || [])].filter(Boolean))) as string[];
    if (candidates.length > 0) {
      // 精确刷新：仅刷新 focusKey 的祖先路径中已加载的分支
      for (const rk of candidates) {
        const parts = rk.split('/').filter(Boolean);
        for (let i = 1; i <= parts.length; i++) {
          const prefix = parts.slice(0, i).join('/');
          if (!targetKeys.includes(prefix) && loadedChildren[prefix]) targetKeys.push(prefix);
        }
      }
    } else {
      // 无焦点路径时，以当前展开项为准
      targetKeys = Object.keys(loadedChildren).filter((kp) =>
        openKeys.some((ok) => kp === ok || kp.startsWith(ok + '/')),
      );
    }
    // 若没有匹配到“当前展开”的分支，则回退刷新顶层已加载分支（如 TableColumnModel）
    if (targetKeys.length === 0) {
      targetKeys = Object.keys(loadedChildren).filter((kp) => kp.indexOf('/') === -1);
    }
    const refreshedInThisVersion = new Set<string>();
    for (const keyPath of targetKeys) {
      const loader = loaderMap.get(keyPath);
      if (!loader) continue;
      try {
        if (!refreshedInThisVersion.has(keyPath)) {
          refreshedInThisVersion.add(keyPath);
          handleLoadChildren(keyPath, loader, true);
        }
      } catch (e) {
        // 忽略刷新错误
      }
    }
  }, [menuVisible, resetKey, rootItems, handleLoadChildren, loadedChildren, openKeySet, refreshKeys]);

  // 取消全量递归预取：避免层级结构导致的重复加载。

  return {
    loadedChildren,
    loadingKeys,
    handleLoadChildren,
  };
};

/**
 * 处理保持下拉菜单打开状态的逻辑
 */
const useKeepDropdownOpen = () => {
  const shouldKeepOpenRef = useRef(false);
  const [forceKeepOpen, setForceKeepOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestKeepOpen = useCallback(() => {
    shouldKeepOpenRef.current = true;
    setForceKeepOpen(true);

    // 使用短 TTL 保持打开，覆盖子菜单关闭级联到顶层的延迟调用
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      shouldKeepOpenRef.current = false;
      setForceKeepOpen(false);
      timerRef.current = null;
    }, 250);
  }, []);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const shouldPreventClose = useCallback(() => {
    return shouldKeepOpenRef.current || forceKeepOpen;
  }, [forceKeepOpen]);

  return {
    requestKeepOpen,
    shouldPreventClose,
  };
};

/**
 * 处理菜单搜索状态
 */
const useMenuSearch = () => {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                  // 移除 ready/opacity 切换，避免可见的淡入闪烁
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

        if (rect.width > 0 && rect.height > 0) {
          container.style.maxHeight = `${dropdownMaxHeight}px`;
          container.style.overflowY = 'auto';
          // 无需额外的 class 标记
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
  const { visible, ...rest } = props;

  useEffect(() => {
    if (inputRef.current && visible) {
      const el = inputRef.current.input || inputRef.current.resizableTextArea?.textArea || inputRef.current;
      try {
        // 防止聚焦导致页面滚动到顶部
        el?.focus?.({ preventScroll: true });
      } catch (e) {
        el?.focus?.();
      }
    }
  }, [visible]);

  return <Input ref={inputRef} {...rest} />;
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
  key: `${searchKey}-search`,
  type: 'group' as const,
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
        onMouseDown={(e) => {
          // 防止菜单聚焦丢失或页面滚动
          e.stopPropagation();
        }}
        size="small"
        style={{
          width: '100%',
          paddingLeft: 0,
          paddingRight: 0,
        }}
      />
    </div>
  ),
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

// 短暂保持打开状态的注册表（用于跨父节点快速重建时的恢复）
const DROPDOWN_PERSIST_TTL_MS = 350;
const dropdownPersistRegistry: Map<string, number> = new Map();

const LazyDropdown: React.FC<Omit<DropdownProps, 'menu'> & { menu: LazyDropdownMenuProps }> = ({ menu, ...props }) => {
  const engine = useFlowEngine();
  const [menuVisible, setMenuVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [rootItems, setRootItems] = useState<Item[]>([]);
  const [rootLoading, setRootLoading] = useState(false);
  const dropdownMaxHeight = useNiceDropdownMaxHeight();
  const t = engine.translate.bind(engine);

  // 解构 menu，避免在 effect 中直接依赖整个对象，减少不必要的重跑并满足 exhaustive-deps
  const { items: menuItems, keepDropdownOpen, persistKey, stateVersion, refreshKeys, ...dropdownMenuProps } = menu;

  // 使用自定义 hooks
  const { loadedChildren, loadingKeys, handleLoadChildren } = useAsyncMenuItems(
    menuVisible,
    rootItems,
    stateVersion,
    openKeys,
    refreshKeys,
  );
  const { searchValues, isSearching, updateSearchValue } = useMenuSearch();
  const { requestKeepOpen, shouldPreventClose } = useKeepDropdownOpen();
  useSubmenuStyles(menuVisible, dropdownMaxHeight);

  // 在挂载时，若存在 persistKey 且仍在持久期内，则尝试恢复打开状态
  useEffect(() => {
    if (!persistKey) return;
    const until = dropdownPersistRegistry.get(persistKey) || 0;
    if (until > Date.now()) {
      setMenuVisible(true);
    }
  }, [persistKey]);

  // 在卸载时，若当前是打开状态，记录一个短暂的保持时间窗，供下次重挂载时恢复
  useEffect(() => {
    return () => {
      if (persistKey && menuVisible) {
        const until = Date.now() + DROPDOWN_PERSIST_TTL_MS;
        dropdownPersistRegistry.set(persistKey, until);
        // 定时清理
        setTimeout(() => {
          const v = dropdownPersistRegistry.get(persistKey) || 0;
          if (v <= Date.now()) dropdownPersistRegistry.delete(persistKey);
        }, DROPDOWN_PERSIST_TTL_MS + 100);
      }
    };
  }, [persistKey, menuVisible]);

  // 加载根 items，支持同步/异步函数
  useEffect(() => {
    const loadRootItems = async () => {
      let resolvedItems: Item[];
      if (typeof menuItems === 'function') {
        setRootLoading(true);
        try {
          const res = menuItems();
          resolvedItems = res instanceof Promise ? await res : res;
        } finally {
          setRootLoading(false);
        }
      } else {
        resolvedItems = menuItems;
      }
      setRootItems(resolvedItems);
    };

    loadRootItems();
  }, [stateVersion, menuItems]);

  // 递归解析 items，支持 children 为同步/异步函数
  function buildSearchChildren(
    children: Item[],
    item: Item,
    keyPath: string,
    path: string[],
    menuVisible: boolean,
    resolve: (items: Item[], path?: string[]) => any[],
  ): any[] {
    const searchKey = keyPath;
    const currentSearchValue = searchValues[searchKey] || '';

    // 递归过滤：当 child 为分组时，会继续向下过滤其 children；
    // 仅保留自身匹配或存在匹配子项的分组。
    const filteredChildren = currentSearchValue
      ? (function deepFilter(items: Item[]): Item[] {
          const searchText = currentSearchValue.toLowerCase();
          const tryString = (v: any) => {
            if (!v) return '';
            return typeof v === 'string' ? v : String(v);
          };
          return items
            .map((child) => {
              const labelStr = tryString(child.label).toLowerCase();
              const selfMatch =
                labelStr.includes(searchText) || (child.key && String(child.key).toLowerCase().includes(searchText));
              if (child.type === 'group' && Array.isArray(child.children)) {
                const nested = deepFilter(child.children);
                if (selfMatch || nested.length > 0) {
                  return { ...child, children: nested } as Item;
                }
                return null;
              }
              return selfMatch ? child : null;
            })
            .filter(Boolean) as Item[];
        })(children)
      : children;

    const resolvedFiltered = resolve(filteredChildren, [...path, item.key]);
    const searchItem = createSearchItem(item, searchKey, currentSearchValue, menuVisible, t, updateSearchValue);
    const dividerItem = { key: `${keyPath}-search-divider`, type: 'divider' as const };

    if (currentSearchValue && resolvedFiltered.length === 0) {
      return [searchItem, dividerItem, createEmptyItem(keyPath, t)];
    }
    return [searchItem, dividerItem, ...resolvedFiltered];
  }

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
        // 对于 group 的异步 children，若尚未加载则在解析阶段直接触发加载，
        // 以支持“嵌套分组”的按需预取（上层 effect 仅能捕获到初始根层分组）。
        if (hasAsyncChildren && !loaded && menuVisible) {
          handleLoadChildren(keyPath, item.children as () => Item[] | Promise<Item[]>);
        }
        let groupChildren = children ? resolveItems(children, [...path, item.key]) : [];

        // 如果 group 启用了搜索功能，在 children 前面添加搜索框
        if (item.searchable && children) {
          groupChildren = buildSearchChildren(children, item, keyPath, path, menuVisible, resolveItems);
        }

        return {
          type: 'group',
          key: keyPath,
          label: typeof item.label === 'string' ? t(item.label) : item.label,
          children: groupChildren,
        };
      }

      if (item.type === 'divider') {
        return { type: 'divider', key: keyPath };
      }

      // 非 group 的“子菜单”也支持本层级搜索：当 item.searchable = true 且存在 children 时
      if (item.searchable && children) {
        return {
          key: item.key,
          label: typeof item.label === 'string' ? t(item.label) : item.label,
          onClick: (info: any) => {},
          onMouseEnter: () => {
            setOpenKeys((prev) => {
              if (prev.has(keyPath)) return prev;
              const next = new Set(prev);
              next.add(keyPath);
              return next;
            });
          },
          children: buildSearchChildren(children, item, keyPath, path, menuVisible, resolveItems),
        };
      }

      return {
        key: keyPath,
        label: typeof item.label === 'string' ? t(item.label) : item.label,
        onClick: (info: any) => {
          if (children) {
            return;
          }

          // 检查是否应该保持下拉菜单打开
          const itemShouldKeepOpen = item.keepDropdownOpen ?? keepDropdownOpen ?? false;

          // 如果需要保持菜单打开，请求保持打开状态
          if (itemShouldKeepOpen) {
            requestKeepOpen();
          }

          const extendedInfo: ExtendedMenuInfo = {
            ...info,
            item: info.item || item,
            originalItem: item,
            keepDropdownOpen: itemShouldKeepOpen,
          };

          menu.onClick?.(extendedInfo);
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
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu,
      .ant-dropdown-menu-submenu-popup .ant-dropdown-menu-submenu-popup .ant-dropdown-menu {
        max-height: ${dropdownMaxHeight}px !important;
        overflow-y: auto !important;
      }
    `;
  }, [dropdownMaxHeight]);

  const items =
    rootLoading && rootItems.length === 0
      ? [
          {
            key: 'root-loading',
            label: <Spin size="small" />,
            disabled: true,
          },
        ]
      : resolveItems(rootItems);

  return (
    <Dropdown
      {...props}
      open={menuVisible}
      destroyPopupOnHide
      overlayClassName={overlayClassName}
      placement="bottomLeft"
      menu={{
        ...dropdownMenuProps,
        items: items,
        onClick: () => {},
        style: {
          maxHeight: dropdownMaxHeight,
          overflowY: 'auto',
          ...dropdownMenuProps?.style,
        },
      }}
      onOpenChange={(visible) => {
        // 阻止在搜索时关闭菜单
        if (!visible && isSearching) {
          return;
        }

        // 阻止在需要保持打开时关闭菜单
        if (!visible && shouldPreventClose()) {
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
