import Icon, { TableOutlined } from '@ant-design/icons';
import { Divider, Empty, Input, MenuProps, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SchemaInitializerItem,
  SchemaInitializerMenu,
  useSchemaInitializer,
  useSchemaInitializerMenuItems,
} from '../../application';
import { useCompile } from '../../schema-component';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useCollectionDataSourceItemsV2 } from '../utils';

const MENU_ITEM_HEIGHT = 40;
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

export function useMenuSearch(items: any[], isOpenSubMenu: boolean, showType?: boolean) {
  const [searchValue, setSearchValue] = useState('');
  const [count, setCount] = useState(STEP);
  useEffect(() => {
    if (isOpenSubMenu) {
      setSearchValue('');
    }
  }, [isOpenSubMenu]);

  // 根据搜索的值进行处理
  const searchedItems = useMemo(() => {
    if (!searchValue) return items;
    const lowerSearchValue = searchValue.toLocaleLowerCase();
    return items.filter(
      (item) =>
        (item.label || item.title) &&
        String(item.label || item.title)
          .toLocaleLowerCase()
          .includes(lowerSearchValue),
    );
  }, [searchValue, items]);

  const shouldLoadMore = useMemo(() => searchedItems.length > count, [count, searchedItems]);

  // 根据 count 进行懒加载处理
  const limitedSearchedItems = useMemo(() => {
    return searchedItems.slice(0, count);
  }, [searchedItems, count]);

  // 最终的返回结果
  const resultItems = useMemo<MenuProps['items']>(() => {
    // isMenuType 为了 `useSchemaInitializerMenuItems()` 里面处理判断标识的
    const res: any[] = [
      // 开头：搜索框
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
        showType ? { isMenuType: true } : {},
      ),
    ];

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
  }, [limitedSearchedItems, searchValue, shouldLoadMore, showType]);

  return resultItems;
}

export interface DataBlockInitializerProps {
  templateWrap?: (
    templateSchema: any,
    {
      item,
    }: {
      item: any;
    },
  ) => any;
  onCreateBlockSchema?: (args: any) => void;
  createBlockSchema?: (args: any) => any;
  isCusomeizeCreate?: boolean;
  icon?: string | React.ReactNode;
  name: string;
  title: string;
  items?: any[];
  filterItems?: (item: any, index: number, items: any[]) => boolean;
  componentType: string;
}

export const DataBlockInitializer = (props: DataBlockInitializerProps) => {
  const {
    templateWrap,
    onCreateBlockSchema,
    componentType,
    createBlockSchema,
    isCusomeizeCreate,
    icon = TableOutlined,
    name,
    title,
    items,
    filterItems,
  } = props;
  const { insert } = useSchemaInitializer();
  const compile = useCompile();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const onClick = useCallback(
    async ({ item }) => {
      if (item.template) {
        const s = await getTemplateSchemaByMode(item);
        templateWrap ? insert(templateWrap(s, { item })) : insert(s);
      } else {
        if (onCreateBlockSchema) {
          onCreateBlockSchema({ item });
        } else if (createBlockSchema) {
          insert(createBlockSchema({ collection: item.collectionName || item.name, isCusomeizeCreate }));
        }
      }
    },
    [createBlockSchema, getTemplateSchemaByMode, insert, isCusomeizeCreate, onCreateBlockSchema, templateWrap],
  );
  const defaultItems = useCollectionDataSourceItemsV2(componentType);
  const menuChildren = useMemo(() => {
    const result = items || defaultItems;
    if (filterItems) {
      return result.filter(filterItems);
    }
    return result;
  }, [items, defaultItems]);
  const childItems = useSchemaInitializerMenuItems(menuChildren, name, onClick);
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false);
  const searchedChildren = useMenuSearch(childItems, isOpenSubMenu);
  const compiledMenuItems = useMemo(
    () => [
      {
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        onClick: (info) => {
          if (info.key !== name) return;
          onClick({ ...info, item: props });
        },
        children: searchedChildren,
      },
    ],
    [name, compile, title, icon, searchedChildren, onClick, props],
  );

  if (menuChildren.length > 0) {
    return (
      <SchemaInitializerMenu
        onOpenChange={(keys) => {
          setIsOpenSubMenu(keys.length > 0);
        }}
        items={compiledMenuItems}
      />
    );
  }

  return <SchemaInitializerItem {...props} onClick={onClick} />;
};
