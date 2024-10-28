/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Divider, Empty, Input, MenuProps } from 'antd';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const SearchFields = ({ value: outValue, onChange }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(outValue);
  const inputRef = useRef<any>('');

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

  const compositionRef = useRef<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!compositionRef.current) {
      onChange(e.target.value);
      setValue(e.target.value);
    }
  };
  const Composition = (e: React.CompositionEvent<HTMLInputElement> | any) => {
    if (e.type === 'compositionend') {
      compositionRef.current = false;
      handleChange(e);
    } else {
      compositionRef.current = true;
    }
  };
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        allowClear
        style={{ padding: '0 4px 6px 16px', boxShadow: 'none' }}
        bordered={false}
        placeholder={t('Search')}
        defaultValue={value}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onChange={handleChange}
        onCompositionStart={Composition}
        onCompositionEnd={Composition}
        onCompositionUpdate={Composition}
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
  const items = children?.concat?.() || [];
  const [searchValue, setSearchValue] = useState(null);
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
    return searchedItems;
  }, [searchedItems]);

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

  // 处理嵌套的子菜单
  const result = useMemo(() => {
    return resultItems.map((item: any) => {
      if (['subMenu', 'itemGroup'].includes(item.type)) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const child = useMenuSearch({
          children: item.children,
          showType,
          hideSearch,
        });
        return { ...item, children: child };
      }
      return item;
    });
  }, [resultItems, showType, hideSearch]);

  return children ? result : undefined;
}
