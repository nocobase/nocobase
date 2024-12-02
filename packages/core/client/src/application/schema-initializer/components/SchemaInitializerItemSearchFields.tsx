/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { Divider, Empty, Input, MenuProps } from 'antd';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../../';

function getPrefixAndCompare(a, b) {
  const prefixA = a.replace(/-displayCollectionFields$/, '');
  const prefixB = b.replace(/-displayCollectionFields$/, '');

  // 判断 a 是否包含 b，如果包含则返回 false，否则返回 true
  return !prefixA.includes(prefixB);
}

export const SearchFields = ({ value: outValue, onChange, name }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(outValue);
  const inputRef = useRef<any>('');

  // 生成唯一的ID用于区分不同层级的SearchFields
  const uniqueId = useRef(`${name || Math.random().toString(10).substr(2, 9)}`);

  useEffect(() => {
    setValue(outValue);
  }, [outValue]);

  useEffect(() => {
    const focusInput = () => {
      if (
        document.activeElement?.id !== inputRef.current.input.id &&
        getPrefixAndCompare(document.activeElement?.id, inputRef.current.input.id)
      ) {
        inputRef.current?.focus();
      }
    };

    // 观察当前元素是否在视图中
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((v) => v.isIntersecting)) {
        focusInput();
      }
    });
    if (inputRef.current?.input) {
      inputRef.current.input.id = uniqueId.current; // 设置唯一ID
      observer.observe(inputRef.current.input);
    }

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

export const useMenuSearch = (props: { children: any[]; showType?: boolean; hideSearch?: boolean; name?: string }) => {
  const { children, showType, hideSearch, name } = props;
  const items = children?.concat?.() || [];
  const [searchValue, setSearchValue] = useState(null);
  const compile = useCompile();

  // 处理搜索逻辑
  const limitedSearchedItems = useMemo(() => {
    if (!searchValue || searchValue === '') {
      return items;
    }
    const lowerSearchValue = searchValue.toLocaleLowerCase();
    return items.filter((item) => {
      return (
        (item.title || item.label) &&
        String(compile(item.title || item.label))
          .toLocaleLowerCase()
          .includes(lowerSearchValue)
      );
    });
  }, [searchValue, items]);

  // 最终结果项
  const resultItems = useMemo<MenuProps['items']>(() => {
    const res = [];
    try {
      // 如果满足条件则显示搜索框
      if (!hideSearch && (items.length > 10 || searchValue)) {
        res.push({
          key: `search-${uid()}`,
          Component: () => (
            <SearchFields name={name} value={searchValue} onChange={(val: string) => setSearchValue(val)} />
          ),
          onClick({ domEvent }) {
            domEvent.stopPropagation();
          },
          ...(showType ? { isMenuType: true } : {}),
        });
      }

      // 如果有匹配的项目，渲染过滤后的项
      if (limitedSearchedItems.length > 0) {
        limitedSearchedItems.forEach((item) => {
          // 如果是子菜单或分组项，递归处理
          if (['subMenu', 'itemGroup'].includes(item.type)) {
            // 避免动态渲染hooks
            const childItems = item.children
              ? // eslint-disable-next-line react-hooks/rules-of-hooks
                useMenuSearch({
                  children: item.children,
                  showType,
                  hideSearch,
                  name: item.name,
                })
              : [];
            res.push({ ...item, children: childItems });
          } else {
            res.push(item);
          }
        });
      } else {
        // 没有匹配项时显示空状态
        res.push({
          key: 'empty',
          style: { height: 150 },
          Component: () => (
            <div onClick={(e) => e.stopPropagation()}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ),
          ...(showType ? { isMenuType: true } : {}),
        });
      }
    } catch (error) {
      res.push(...limitedSearchedItems);
    }
    return res;
  }, [hideSearch, limitedSearchedItems, searchValue, showType]);

  return children ? resultItems : undefined;
};
