/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCompile, withDynamicSchemaProps } from '@nocobase/client';
import { useDebounceFn } from 'ahooks';
import { Tree as AntdTree, Empty, Input, Spin, theme } from 'antd';
import React, { FC, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import type { TreeProps as AntdTreeProps, TreeDataNode } from 'antd';
import type { BasicDataNode, DataNode } from 'rc-tree/lib/interface';

import { BlockName } from '../constants';
import { useTreeTranslation } from '../locale';

const INTERNAL_TITLE_KEY = '__tree_node_title__';

const getParentKey = (
  key: React.Key,
  tree: TreeDataNode[],
  fieldNames?: AntdTreeProps['fieldNames'],
): React.Key | undefined => {
  let parentKey: React.Key;
  const nodeKey = fieldNames?.key || 'key';
  const nodeChildren = fieldNames?.children || 'children';

  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    const children = node[nodeChildren];
    if (Array.isArray(children)) {
      if (children.some((item) => item[nodeKey] === key)) {
        parentKey = node[nodeKey];
      } else {
        const matchedParentKey = getParentKey(key, children, fieldNames);
        if (matchedParentKey) {
          parentKey = matchedParentKey;
        }
      }
    }
  }
  return parentKey;
};

const flatTreeData = (data: TreeDataNode[] = [], fieldNames?: AntdTreeProps['fieldNames']): TreeDataNode[] => {
  const nodeChildren = fieldNames?.children || 'children';
  const result: TreeDataNode[] = [];

  const loop = (items: TreeDataNode[] = []) => {
    for (const item of items) {
      result.push(item);
      const children = item[nodeChildren];
      if (Array.isArray(children)) {
        loop(children);
      }
    }
  };

  loop(data);
  return result;
};

export interface FilterComponentProps {
  value: any;
  onChange: (value: any) => void;
}

export interface TreeProps<T extends BasicDataNode = DataNode> extends AntdTreeProps<T> {
  /**
   * @default true
   */
  searchable?: boolean;
  onSearch?: (value: string) => void;
  loading?: boolean;
  FilterComponent?: React.ComponentType<FilterComponentProps>;
  renderNodeTitle?: (value: any, node: T, fallbackTitle?: React.ReactNode) => React.ReactNode;
  searchExtra?: React.ReactNode;
}

const DefaultFilterComponent: FC<FilterComponentProps> = ({ value, onChange }) => {
  const { t } = useTreeTranslation();
  return <Input allowClear placeholder={t('Search')} onChange={(e) => onChange(e.target.value)} />;
};

export const Tree: FC<TreeProps> = withDynamicSchemaProps(
  (props) => {
    const {
      searchable = true,
      onSearch: propsOnSearch,
      treeData,
      loading,
      fieldNames,
      defaultExpandAll,
      onExpand: propsOnExpand,
      FilterComponent = DefaultFilterComponent,
      defaultExpandedKeys: propsDefaultExpandedKeys,
      expandedKeys: propsExpandedKeys,
      autoExpandParent: propsAutoExpandParent = true,
      renderNodeTitle,
      searchExtra,
      ...treeProps
    } = props;

    const compile = useCompile();
    const fieldKeyName = useMemo(() => fieldNames?.key || 'key', [fieldNames?.key]);
    const fieldChildrenName = useMemo(() => fieldNames?.children || 'children', [fieldNames?.children]);
    const fieldTitleName = useMemo(() => fieldNames?.title || 'title', [fieldNames?.title]);
    const renderedFieldNames = useMemo(
      () => ({
        ...fieldNames,
        title: INTERNAL_TITLE_KEY,
      }),
      [fieldNames],
    );
    const resolvedTreeData = useMemo(() => treeData || [], [treeData]);
    const dataList = useMemo(() => flatTreeData(resolvedTreeData, fieldNames), [fieldNames, resolvedTreeData]);
    const allKeys = useMemo(() => dataList?.map((item) => item[fieldKeyName]), [dataList, fieldKeyName]);
    const allKeySet = useMemo(() => new Set(allKeys), [allKeys]);
    const normalizeExpandedKeys = useCallback(
      (keys?: readonly React.Key[]) => {
        if (!keys) {
          return [];
        }
        if (!allKeySet.size) {
          return [...keys];
        }
        return keys.filter((key) => allKeySet.has(key));
      },
      [allKeySet],
    );
    const getInitialExpandedKeys = useCallback(
      () => normalizeExpandedKeys(propsExpandedKeys ?? propsDefaultExpandedKeys),
      [normalizeExpandedKeys, propsDefaultExpandedKeys, propsExpandedKeys],
    );
    const [expandedKeys, setExpandedKeysState] = useState<React.Key[]>(getInitialExpandedKeys);
    const expandedKeysRef = useRef(expandedKeys);
    const expandedKeysInitializedRef = useRef(false);
    const expandedKeysBeforeSearchRef = useRef<React.Key[] | null>(null);
    const hasUserExpandedRef = useRef(false);
    const previousDefaultExpandAllRef = useRef(defaultExpandAll);
    const isExpandedKeysControlled = propsExpandedKeys !== undefined;

    const [inputValue, setInputValue] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const deferredSearchValue = useDeferredValue(searchValue);
    const [autoExpandParent, setAutoExpandParent] = useState(propsAutoExpandParent);
    const { token } = theme.useToken();
    const hasCustomTitleHandling = Boolean(renderNodeTitle);
    const setExpandedKeys = useCallback(
      (keys?: readonly React.Key[]) => {
        const normalizedKeys = normalizeExpandedKeys(keys);
        expandedKeysRef.current = normalizedKeys;
        setExpandedKeysState(normalizedKeys);
      },
      [normalizeExpandedKeys],
    );

    const resolveNodeTitleText = useCallback(
      (item: TreeDataNode) => {
        const rawTitle = compile(item[fieldTitleName]);

        if (!hasCustomTitleHandling) {
          return String(rawTitle);
        }

        if (rawTitle === null || rawTitle === undefined || rawTitle === '') {
          return 'N/A';
        }

        return String(rawTitle);
      },
      [compile, fieldTitleName, hasCustomTitleHandling],
    );

    const resolveNodeTitle = useCallback(
      (item: TreeDataNode) => {
        const fallbackTitle = resolveNodeTitleText(item);

        if (!renderNodeTitle) {
          return <span>{fallbackTitle}</span>;
        }

        return renderNodeTitle(item[fieldTitleName], item as DataNode) ?? <span>{fallbackTitle}</span>;
      },
      [fieldTitleName, renderNodeTitle, resolveNodeTitleText],
    );

    const searchedTreeData = useMemo(() => {
      const loop = (data: TreeDataNode[]): any[] =>
        data.map((item) => {
          const strTitle = resolveNodeTitleText(item);
          const hasSearchValue =
            deferredSearchValue !== '' && deferredSearchValue !== null && deferredSearchValue !== undefined;
          const index = hasSearchValue ? strTitle.indexOf(String(deferredSearchValue)) : -1;
          const beforeStr = strTitle.substring(0, index);
          const afterStr = strTitle.slice(index + String(deferredSearchValue).length);
          let title: React.ReactNode;

          const highlightedTitle =
            index > -1 ? (
              <span>
                {beforeStr}
                <span style={{ color: token.colorPrimary }}>{deferredSearchValue}</span>
                {afterStr}
              </span>
            ) : null;

          if (index > -1) {
            title = hasCustomTitleHandling
              ? renderNodeTitle?.(item[fieldTitleName], item as DataNode, highlightedTitle) || highlightedTitle
              : highlightedTitle;
          } else {
            title = hasCustomTitleHandling ? resolveNodeTitle(item) : <span>{strTitle}</span>;
          }

          if (item[fieldChildrenName]) {
            return {
              [INTERNAL_TITLE_KEY]: title,
              [fieldKeyName]: item[fieldKeyName],
              [fieldChildrenName]: loop(item[fieldChildrenName]),
            };
          }

          return {
            [INTERNAL_TITLE_KEY]: title,
            [fieldKeyName]: item[fieldKeyName],
          };
        });

      return loop(resolvedTreeData);
    }, [
      deferredSearchValue,
      resolvedTreeData,
      fieldTitleName,
      fieldKeyName,
      fieldChildrenName,
      hasCustomTitleHandling,
      renderNodeTitle,
      resolveNodeTitle,
      resolveNodeTitleText,
      token.colorPrimary,
    ]);
    const onExpand: TreeProps['onExpand'] = useCallback(
      (newExpandedKeys, info) => {
        hasUserExpandedRef.current = true;
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(false);
        propsOnExpand?.(newExpandedKeys, info);
      },
      [propsOnExpand, setExpandedKeys],
    );

    const onSearch = useDebounceFn(
      (value) => {
        setSearchValue(value);
        propsOnSearch?.(value);
      },
      {
        wait: 400,
      },
    );

    const onFilterChange = useCallback(
      (value) => {
        setInputValue(value);
        onSearch.run(value);
      },
      [onSearch],
    );

    useEffect(() => {
      if (deferredSearchValue) {
        if (!expandedKeysBeforeSearchRef.current) {
          expandedKeysBeforeSearchRef.current = expandedKeysRef.current;
        }

        const newExpandedKeys = dataList
          .map((item) => {
            if (String(item[fieldTitleName]).indexOf(deferredSearchValue) > -1) {
              return getParentKey(item[fieldKeyName], resolvedTreeData, fieldNames);
            }
            return null;
          })
          .filter((item, i, self): item is React.Key => !!(item && self.indexOf(item) === i));
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(true);
        return;
      }

      if (expandedKeysBeforeSearchRef.current) {
        setExpandedKeys(expandedKeysBeforeSearchRef.current);
        expandedKeysBeforeSearchRef.current = null;
        setAutoExpandParent(false);
        return;
      }

      if (isExpandedKeysControlled) {
        setExpandedKeys(propsExpandedKeys);
        setAutoExpandParent(propsAutoExpandParent);
        expandedKeysInitializedRef.current = true;
        return;
      }

      const defaultExpandAllChanged = previousDefaultExpandAllRef.current !== defaultExpandAll;
      previousDefaultExpandAllRef.current = defaultExpandAll;

      if (!expandedKeysInitializedRef.current || defaultExpandAllChanged) {
        setExpandedKeys(defaultExpandAll ? allKeys : propsDefaultExpandedKeys);
        setAutoExpandParent(true);
        expandedKeysInitializedRef.current = true;
        hasUserExpandedRef.current = false;
        return;
      }

      if (defaultExpandAll && !hasUserExpandedRef.current) {
        setExpandedKeys(allKeys);
        setAutoExpandParent(true);
      } else {
        setExpandedKeys(expandedKeysRef.current);
        setAutoExpandParent(false);
      }
    }, [
      deferredSearchValue,
      fieldTitleName,
      fieldKeyName,
      dataList,
      defaultExpandAll,
      fieldNames,
      allKeys,
      propsExpandedKeys,
      propsAutoExpandParent,
      propsDefaultExpandedKeys,
      resolvedTreeData,
      isExpandedKeysControlled,
      setExpandedKeys,
    ]);

    return (
      <div>
        {(searchable || searchExtra) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: token.marginXS,
              marginBottom: token.marginXS,
            }}
          >
            {searchable && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <FilterComponent value={inputValue} onChange={onFilterChange} />
              </div>
            )}
            {searchExtra && <div style={{ flexShrink: 0 }}>{searchExtra}</div>}
          </div>
        )}
        {!loading ? (
          searchedTreeData.length ? (
            <AntdTree
              {...treeProps}
              onExpand={onExpand}
              fieldNames={renderedFieldNames}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              treeData={searchedTreeData}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )
        ) : (
          <div style={{ height: 200, marginTop: token.margin, textAlign: 'center' }}>
            <Spin />
          </div>
        )}
      </div>
    );
  },
  { displayName: BlockName },
);
