/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Divider, Empty, Input, MenuProps, Spin } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STEP = 15;

export const SearchFields = ({ value: outValue, onChange }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(outValue);
  const inputRef = React.useRef<any>(null);

  // 之所以要增加个内部的 value 是为了防止用户输入过快时造成卡顿的问题
  useEffect(() => {
    setValue(outValue);
  }, [outValue]);

  useEffect(() => {
    inputRef.current.input.focus();
    const observer = new IntersectionObserver((entries) => {});
    observer.observe(inputRef.current.input);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        allowClear
        style={{ padding: '0 4px 6px 16px', boxShadow: 'none' }}
        bordered={false}
        placeholder={t('Search')}
        value={value}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setValue(e.target.value);
          e.stopPropagation();
        }}
      />
      <Divider style={{ margin: 0 }} />
    </div>
  );
};

export function useMenuSearch({
  children,
  showType,
  hideSearch,
}: {
  children: any[];
  showType?: boolean;
  hideSearch?: boolean;
}) {
  const items = children.concat();
  const [searchValue, setSearchValue] = useState(null);
  const [count, setCount] = useState(STEP);
  const currentItems = useMemo(() => {
    return items || [];
  }, [items]);

  // 根据搜索的值进行处理
  const searchedItems = useMemo(() => {
    if (!searchValue || searchValue === '') {
      return items;
    }
    const lowerSearchValue = searchValue.toLocaleLowerCase();
    return currentItems.filter(
      (item) =>
        (item.label || item.title) &&
        String(item.label || item.title)
          .toLocaleLowerCase()
          .includes(lowerSearchValue),
    );
  }, [searchValue, currentItems]);

  // 根据 count 进行懒加载处理
  const limitedSearchedItems = useMemo(() => {
    return searchedItems.slice(0, count);
  }, [searchedItems, count]);

  // 最终的返回结果
  const resultItems = useMemo<MenuProps['items']>(() => {
    const res = [];
    if (!hideSearch && (items.length > 10 || searchValue)) {
      // 开头：搜索框
      res.push(
        Object.assign(
          {
            key: 'search',
            Component: () => (
              <SearchFields
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
    } else {
      // 搜索结果为空
      res.push(
        Object.assign(
          {
            key: 'empty',
            style: {
              height: 150,
            },
            Component: () => (
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
  }, [hideSearch, limitedSearchedItems, searchValue, showType]);

  const res = useMemo(() => {
    return resultItems;
  }, [children, resultItems]);
  return res;
}
