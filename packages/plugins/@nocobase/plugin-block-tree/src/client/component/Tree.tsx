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
import React, { FC, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import type { TreeProps as AntdTreeProps, TreeDataNode } from 'antd';
import type { BasicDataNode, DataNode } from 'rc-tree/lib/interface';

import { BlockName } from '../constants';
import { useTreeTranslation } from '../locale';

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
  renderNodeTitle?: (value: any, node: T) => React.ReactNode;
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
      ...treeProps
    } = props;

    const compile = useCompile();
    const fieldKeyName = useMemo(() => fieldNames?.key || 'key', [fieldNames?.key]);
    const fieldChildrenName = useMemo(() => fieldNames?.children || 'children', [fieldNames?.children]);
    const fieldTitleName = useMemo(() => fieldNames?.title || 'title', [fieldNames?.title]);
    const resolvedTreeData = useMemo(() => treeData || [], [treeData]);
    const dataList = useMemo(
      () => (searchable || defaultExpandAll ? flatTreeData(resolvedTreeData, fieldNames) : null),
      [defaultExpandAll, fieldNames, resolvedTreeData, searchable],
    );
    const allKeys = useMemo(() => dataList?.map((item) => item[fieldKeyName]), [dataList, fieldKeyName]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(propsExpandedKeys);

    const [inputValue, setInputValue] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const deferredSearchValue = useDeferredValue(searchValue);
    const [autoExpandParent, setAutoExpandParent] = useState(propsAutoExpandParent);
    const { token } = theme.useToken();
    const hasCustomTitleHandling = Boolean(renderNodeTitle);

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

          if (index > -1) {
            title = (
              <span>
                {beforeStr}
                <span style={{ color: token.colorPrimary }}>{deferredSearchValue}</span>
                {afterStr}
              </span>
            );
          } else {
            title = hasCustomTitleHandling ? resolveNodeTitle(item) : <span>{strTitle}</span>;
          }

          if (item[fieldChildrenName]) {
            return {
              [fieldTitleName]: title,
              [fieldKeyName]: item[fieldKeyName],
              [fieldChildrenName]: loop(item[fieldChildrenName]),
            };
          }

          return {
            [fieldTitleName]: title,
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
      resolveNodeTitle,
      resolveNodeTitleText,
      token.colorPrimary,
    ]);
    const onExpand: TreeProps['onExpand'] = useCallback(
      (newExpandedKeys, info) => {
        setExpandedKeys(newExpandedKeys);
        setAutoExpandParent(false);
        propsOnExpand?.(newExpandedKeys, info);
      },
      [propsOnExpand],
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
        const newExpandedKeys = dataList
          .map((item) => {
            if (String(item[fieldTitleName]).indexOf(deferredSearchValue) > -1) {
              return getParentKey(item[fieldKeyName], treeData, fieldNames);
            }
            return null;
          })
          .filter((item, i, self): item is React.Key => !!(item && self.indexOf(item) === i));
        setExpandedKeys(newExpandedKeys);
      } else {
        if (defaultExpandAll) {
          setExpandedKeys(allKeys);
        } else {
          setExpandedKeys(propsExpandedKeys || propsDefaultExpandedKeys);
        }
      }
      setAutoExpandParent(true);
    }, [
      deferredSearchValue,
      treeData,
      fieldTitleName,
      fieldKeyName,
      fieldChildrenName,
      dataList,
      defaultExpandAll,
      fieldNames,
      allKeys,
      propsExpandedKeys,
      propsDefaultExpandedKeys,
    ]);

    return (
      <div>
        {searchable && (
          <div style={{ marginBottom: token.marginXS }}>
            <FilterComponent value={inputValue} onChange={onFilterChange} />
          </div>
        )}
        {!loading ? (
          searchedTreeData.length ? (
            <AntdTree
              {...treeProps}
              onExpand={onExpand}
              fieldNames={fieldNames}
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
