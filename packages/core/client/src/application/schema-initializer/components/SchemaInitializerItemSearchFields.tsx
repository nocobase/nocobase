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
import React, { useEffect, useRef, useState } from 'react';
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
        inputRef.current &&
        document.activeElement?.id !== inputRef.current.input.id &&
        getPrefixAndCompare(document.activeElement?.id, inputRef.current.input.id)
      ) {
        inputRef.current.focus();
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
let currentName = null;
export const useMenuSearch = (props: { children: any[]; showType?: boolean; hideSearch?: boolean; name?: string }) => {
  const { children, showType, hideSearch, name } = props;
  const compile = useCompile();
  const [searchValue, setSearchValue] = useState(null);
  // 处理搜索逻辑
  const filteredItems = (data, name) => {
    if (!searchValue || searchValue === '' || (currentName && currentName !== name)) {
      return data;
    }
    const lowerSearchValue = searchValue.toLocaleLowerCase();
    return data.filter((item) => {
      return (
        (item.title || item.label) &&
        String(compile(item.title || item.label))
          .toLocaleLowerCase()
          .includes(lowerSearchValue)
      );
    });
  };

  // 递归处理菜单项，传递每一层的filteredItems
  const generateResultItems = (items: any[], name, parentItems: Set<any> = new Set()): MenuProps['items'] => {
    const res = [];
    // 如果满足条件则显示搜索框
    if (!hideSearch && (items.length > 10 || searchValue) && !['subMenu', 'itemGroup'].includes(items[0]?.type)) {
      res.push({
        key: `search-${uid()}`,
        Component: () => {
          return (
            <SearchFields
              name={name}
              value={!currentName || currentName === name ? searchValue : ''}
              onChange={(val: string) => {
                currentName = name;
                setSearchValue(val);
              }}
            />
          );
        },
        onClick({ domEvent }) {
          domEvent.stopPropagation();
        },
        ...(showType ? { isMenuType: true } : {}),
      });
    }

    // 递归处理所有项，包含子菜单
    items.forEach((item) => {
      if (parentItems.has(item)) return;

      parentItems.add(item);

      // 过滤当前项是否匹配搜索条件
      if (['subMenu', 'itemGroup'].includes(item.type)) {
        // 对子菜单项进行递归处理
        const result =
          !currentName || currentName === item.name ? filteredItems(item.children.concat(), item.name) : item.children;
        const filteredChildren = generateResultItems(result, item.name, parentItems);
        res.push({ ...item, children: filteredChildren });
      } else {
        // 处理非子菜单项
        res.push(item);
      }
    });

    // 如果没有匹配项时显示空状态
    if (items.length === 0) {
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

    return res;
  };

  // 获取最终的结果项，处理根级菜单项
  const resultItems = generateResultItems(filteredItems(children?.concat() || [], name), name);

  return children ? resultItems : undefined;
};
