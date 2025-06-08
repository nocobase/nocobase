/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Icon, { TableOutlined } from '@ant-design/icons';
import { Divider, Empty, Input, MenuProps, Spin } from 'antd';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SchemaInitializerItem,
  SchemaInitializerMenu,
  useGetSchemaInitializerMenuItems,
  useSchemaInitializer,
} from '../../application';
import { DataSource } from '../../data-source';
import { Collection, CollectionFieldOptions } from '../../data-source/collection/Collection';
import { useCompile } from '../../schema-component';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useCollectionDataSourceItems } from '../utils';
import { useTemplateBlockNotifier } from '../hooks/useTemplateBlockNotifier';

const MENU_ITEM_HEIGHT = 32;
const STEP = 15;

export const SearchCollections = ({ value: outValue, onChange }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(outValue);
  const inputRef = React.useRef<any>(null);

  // 之所以要增加个内部的 value 是为了防止用户输入过快时造成卡顿的问题
  useEffect(() => {
    setValue(outValue);
  }, [outValue]);

  // TODO: antd 的 Input 的 autoFocus 有 BUG，会不生效，等待官方修复后再简化：https://github.com/ant-design/ant-design/issues/41239
  useEffect(() => {
    // 1. 组件在第一次渲染时自动 focus，提高用户体验
    inputRef.current.input.focus();

    // 2. 当组件已经渲染，并再次显示时，自动 focus
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        inputRef.current.input.focus();
      }
    });

    observer.observe(inputRef.current.input);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ width: 210 }} onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        allowClear
        style={{ padding: '0 4px 6px', boxShadow: 'none' }}
        bordered={false}
        placeholder={t('Search and select collection')}
        value={value}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setValue(e.target.value);
        }}
      />
      <Divider style={{ margin: 0 }} />
    </div>
  );
};

const LoadingItem = ({ loadMore, maxHeight }) => {
  const spinRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = spinRef.current;
    if (!el) return;

    let container = el.parentElement;
    while (container && container.tagName !== 'UL') {
      container = container.parentElement;
    }

    const checkLoadMore = function () {
      if (!container) return;
      // 判断滚动是否到达底部
      if (Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) <= MENU_ITEM_HEIGHT) {
        // 到达底部，执行加载更多的操作
        loadMore();
      }
    };

    // 监听滚动，滚动到底部触发加载更多
    if (container) {
      container.style.height = `${maxHeight - MENU_ITEM_HEIGHT}px`;
      container.style.maxHeight = 'inherit';
      container.style.overflowY = 'scroll';
      container.addEventListener('scroll', checkLoadMore);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkLoadMore);
        delete container.style.height;
      }
    };
  }, [loadMore, maxHeight]);

  return (
    <div ref={spinRef} onClick={(e) => e.stopPropagation()}>
      <Spin size="small" style={{ width: '100%' }} />
    </div>
  );
};

export function useMenuSearch({
  data,
  openKeys,
  showType,
  hideSearch,
}: {
  data: any[];
  openKeys: string[];
  showType?: boolean;
  hideSearch?: boolean;
}) {
  const [searchValue, setSearchValue] = useState('');
  const [count, setCount] = useState(STEP);

  const isMuliSource = useMemo(() => data.length > 1, [data]);
  const openKey = useMemo(() => {
    return isMuliSource ? openKeys?.[1] : openKeys?.length > 0;
  }, [openKeys]);

  useEffect(() => {
    if (!openKey) {
      setSearchValue('');
    }
  }, [openKey]);

  const currentItems = useMemo(() => {
    if (isMuliSource) {
      if (!openKey) return [];
      return data.find((item) => (item.key || item.name) === openKey)?.children || [];
    }
    return data[0]?.children || [];
  }, [data, isMuliSource, openKey]);

  // 根据搜索的值进行处理
  const searchedItems = useMemo(() => {
    if (!searchValue) return currentItems;
    const lowerSearchValue = searchValue.toLocaleLowerCase();
    return currentItems.filter(
      (item) =>
        (item.label || item.title) &&
        String(item.label || item.title)
          .toLocaleLowerCase()
          .includes(lowerSearchValue),
    );
  }, [searchValue, currentItems]);

  const shouldLoadMore = useMemo(() => searchedItems.length > count, [count, searchedItems]);

  // 根据 count 进行懒加载处理
  const limitedSearchedItems = useMemo(() => {
    return searchedItems.slice(0, count);
  }, [searchedItems, count]);

  // 最终的返回结果
  const resultItems = useMemo<MenuProps['items']>(() => {
    const res = [];
    if (!hideSearch) {
      // 开头：搜索框
      res.push(
        Object.assign(
          {
            key: 'search',
            label: (
              <SearchCollections
                value={searchValue}
                onChange={(val: string) => {
                  setCount(STEP);
                  setSearchValue(val);
                }}
              />
            ),
            onClick({ domEvent }) {
              domEvent.stopPropagation();
            },
          },
          // isMenuType 为了 `useSchemaInitializerMenuItems()` 里面处理判断标识的
          showType ? { isMenuType: true } : {},
        ),
      );
    }

    // 中间：搜索的数据
    if (limitedSearchedItems.length > 0) {
      // 有搜索结果
      res.push(...limitedSearchedItems);
      if (shouldLoadMore) {
        res.push(
          Object.assign(
            {
              key: 'load-more',
              label: (
                <LoadingItem
                  maxHeight={STEP * MENU_ITEM_HEIGHT}
                  loadMore={() => {
                    setCount((count) => count + STEP);
                  }}
                />
              ),
            },
            showType ? { isMenuType: true } : {},
          ),
        );
      }
    } else {
      // 搜索结果为空
      res.push(
        Object.assign(
          {
            key: 'empty',
            style: {
              height: 150,
            },
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ),
          },
          showType ? { isMenuType: true } : {},
        ),
      );
    }

    return res;
  }, [hideSearch, limitedSearchedItems, searchValue, shouldLoadMore, showType]);

  const res = useMemo(() => {
    if (!isMuliSource) return resultItems;
    return data.map((item) => {
      if (openKey && item.key === openKey) {
        return {
          ...item,
          children: resultItems,
        };
      } else {
        return {
          ...item,
          children: [],
        };
      }
    });
  }, [data, isMuliSource, openKey, resultItems]);
  return res;
}

export interface DataBlockInitializerProps {
  templateWrap?: (
    templateSchema: any,
    {
      item,
      fromOthersInPopup,
    }: {
      item: any;
      fromOthersInPopup?: boolean;
    },
  ) => any;
  onCreateBlockSchema?: (args: any) => void;
  createBlockSchema?: (args: any) => any;
  icon?: string | React.ReactNode;
  name: string;
  title: string;
  /**
   * 用来筛选弹窗中的 “Current record” 和 “Associated records” 选项中的数据表
   */
  filter?: (options: { collection: Collection; associationField: CollectionFieldOptions }) => boolean;
  filterDataSource?: (dataSource: DataSource) => boolean;
  /**
   * 用来筛选弹窗中的 “Other records” 选项中的数据表
   */
  filterOtherRecordsCollection?: (collection: Collection) => boolean;
  componentType: string;
  onlyCurrentDataSource?: boolean;
  hideSearch?: boolean;
  showAssociationFields?: boolean;
  /** 如果只有一项数据表时，不显示 children 列表 */
  hideChildrenIfSingleCollection?: boolean;
  items?: ReturnType<typeof useCollectionDataSourceItems>[];
  /**
   * 隐藏弹窗中的 Other records 选项
   */
  hideOtherRecordsInPopup?: boolean;
  onClick?: (args: any) => void;
  /** 用于更改 Current record 的文案 */
  currentText?: string;
  /** 用于更改 Other records 的文案 */
  otherText?: string;
  children?: React.ReactNode;
  alwaysRenderMenu?: boolean; //总是渲染为 SchemaInitializerMenu
}

export const DataBlockInitializer: FC<DataBlockInitializerProps> = (props) => {
  const {
    templateWrap,
    onCreateBlockSchema,
    componentType,
    icon = TableOutlined,
    name,
    title,
    filter,
    onlyCurrentDataSource,
    hideSearch,
    showAssociationFields,
    hideChildrenIfSingleCollection,
    filterDataSource,
    items: itemsFromProps,
    hideOtherRecordsInPopup,
    onClick: propsOnClick,
    filterOtherRecordsCollection,
    currentText,
    otherText,
    alwaysRenderMenu,
  } = props;
  const { insert, setVisible } = useSchemaInitializer();
  const compile = useCompile();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const templateBlockAddedNotifier = useTemplateBlockNotifier();

  const onClick = useCallback(
    async (options) => {
      templateBlockAddedNotifier({
        collection: options.item.name,
        dataSource: options.item.dataSource,
        componentType: componentType,
        menuName: name,
      });
      const { item, fromOthersInPopup } = options;

      if (propsOnClick) {
        return propsOnClick(options);
      }

      if (item.template) {
        const s = await getTemplateSchemaByMode(item);
        templateWrap ? insert(templateWrap(s, { item, fromOthersInPopup })) : insert(s);
      } else if (item.schemaInsertor) {
        await item.schemaInsertor(insert, { item, name, fromOthersInPopup });
      } else {
        if (onCreateBlockSchema) {
          onCreateBlockSchema({ item, fromOthersInPopup });
        }
      }

      setVisible(false);
    },
    [
      getTemplateSchemaByMode,
      insert,
      setVisible,
      onCreateBlockSchema,
      propsOnClick,
      templateWrap,
      templateBlockAddedNotifier,
      name,
      componentType,
    ],
  );
  const items =
    itemsFromProps ||
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCollectionDataSourceItems({
      name,
      componentName: componentType,
      filter,
      filterDataSource,
      filterOtherRecordsCollection,
      onlyCurrentDataSource,
      showAssociationFields,
      dataBlockInitializerProps: props,
      hideOtherRecordsInPopup,
      onClick,
      currentText,
      otherText,
    });
  const getMenuItems = useGetSchemaInitializerMenuItems(onClick);
  const childItems = useMemo(() => {
    return getMenuItems(items, name);
  }, [getMenuItems, items, name]);
  const [openMenuKeys, setOpenMenuKeys] = useState([]);
  const searchedChildren = useMenuSearch({ data: childItems, openKeys: openMenuKeys, hideSearch });
  const compiledMenuItems = useMemo(() => {
    let children = searchedChildren.filter((item) => item.key !== 'search' && item.key !== 'empty');
    if (hideChildrenIfSingleCollection && children.length === 1) {
      // 只有一项可选时，直接展开
      children = children[0].children;
    } else {
      children = searchedChildren;
    }
    return [
      {
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        onClick: (info) => {
          if (info.key !== name) return;
          onClick({ ...info, item: props });
        },
        children,
      },
    ] as MenuProps['items'];
  }, [searchedChildren, hideChildrenIfSingleCollection, name, compile, title, icon, onClick, props]);

  if (childItems.length > 1 || (childItems.length === 1 && childItems[0]?.children?.length > 0) || alwaysRenderMenu) {
    return (
      <SchemaInitializerMenu
        onOpenChange={(keys) => {
          setOpenMenuKeys(keys);
        }}
        items={compiledMenuItems}
      />
    );
  }

  return <SchemaInitializerItem {...props} onClick={onClick} />;
};
