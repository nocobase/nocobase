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
import { cloneDeep } from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import type { TreeProps as AntdTreeProps, TreeDataNode } from 'antd';
import type { BasicDataNode, DataNode } from 'rc-tree/lib/interface';

import { BlockName } from '../constants';
import { useTreeTranslation } from '../locale';

const getParentKey = (key: React.Key, tree: TreeDataNode[], fieldNames?: AntdTreeProps['fieldNames']): React.Key => {
  let parentKey: React.Key;
  const nodeKey = fieldNames?.key || 'key';
  const nodeChildren = fieldNames?.children || 'children';

  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node[nodeChildren]) {
      if (node[nodeChildren].some((item) => item[nodeKey] === key)) {
        parentKey = node[nodeKey];
      } else if (getParentKey(key, node[nodeChildren], fieldNames)) {
        parentKey = getParentKey(key, node[nodeChildren], fieldNames);
      }
    }
  }
  return parentKey!;
};

const flatTreeData = (data: TreeDataNode[] = [], fieldNames?: AntdTreeProps['fieldNames']): TreeDataNode[] => {
  const nodeChildren = fieldNames?.children || 'children';

  return data.reduce((prev, item) => {
    const children = item[nodeChildren];
    const flatChildren = children ? flatTreeData(children) : [];
    return [...prev, item, ...flatChildren];
  }, []);
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
      ...treeProps
    } = props;

    const clonedTreeData = useMemo(() => cloneDeep(treeData), [treeData]);

    const compile = useCompile();
    const fieldKeyName = useMemo(() => fieldNames?.key || 'key', [fieldNames?.key]);
    const fieldChildrenName = useMemo(() => fieldNames?.children || 'children', [fieldNames?.children]);
    const fieldTitleName = useMemo(() => fieldNames?.title || 'title', [fieldNames?.title]);
    const dataList = useMemo(
      () => (searchable || defaultExpandAll ? flatTreeData(clonedTreeData, fieldNames) : null),
      [clonedTreeData],
    );
    const allKeys = useMemo(() => dataList?.map((item) => item[fieldKeyName]), [dataList, fieldKeyName]);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(propsExpandedKeys);

    const [searchValue, setSearchValue] = useState('');
    const [autoExpandParent, setAutoExpandParent] = useState(propsAutoExpandParent);
    const { token } = theme.useToken();

    const searchedTreeData = useMemo(() => {
      const loop = (data: TreeDataNode[]): any[] =>
        data.map((item) => {
          const strTitle = String(compile(item[fieldTitleName]));
          const index = strTitle.indexOf(String(searchValue));
          const beforeStr = strTitle.substring(0, index);
          const afterStr = strTitle.slice(index + String(searchValue).length);
          const title =
            index > -1 ? (
              <span>
                {beforeStr}
                <span style={{ color: token.colorPrimary }}>{searchValue}</span>
                {afterStr}
              </span>
            ) : (
              <span>{strTitle}</span>
            );
          if (item[fieldChildrenName]) {
            return {
              [fieldTitleName]: title,
              [fieldKeyName]: item[fieldKeyName],
              [fieldChildrenName]: loop(cloneDeep(item[fieldChildrenName])),
            };
          }

          return {
            [fieldTitleName]: title,
            [fieldKeyName]: item[fieldKeyName],
          };
        });

      return loop(clonedTreeData || []);
    }, [searchValue, clonedTreeData, fieldTitleName, fieldKeyName, fieldChildrenName]);
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

    useEffect(() => {
      if (searchValue) {
        const newExpandedKeys = dataList
          .map((item) => {
            if (String(item[fieldTitleName]).indexOf(searchValue) > -1) {
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
      searchValue,
      treeData,
      fieldTitleName,
      fieldKeyName,
      fieldChildrenName,
      dataList,
      defaultExpandAll,
      allKeys,
      propsExpandedKeys,
      propsDefaultExpandedKeys,
    ]);

    return (
      <div>
        {searchable && (
          <div style={{ marginBottom: token.marginXS }}>
            <FilterComponent value={searchValue} onChange={onSearch.run} />
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
