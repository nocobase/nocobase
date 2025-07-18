/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCollectionManager_deprecated } from '../collection-manager';
import { withDynamicSchemaProps } from '../hoc/withDynamicSchemaProps';
import { useTableBlockParams } from '../modules/blocks/data-blocks/table/hooks/useTableBlockDecoratorProps';
import { SchemaComponentOptions } from '../schema-component';
import { TableElementRefContext } from '../schema-component/antd/table-v2/Table';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useBlockHeightProps } from './hooks';
/**
 * @internal
 */
export const TableBlockContext = createContext<any>({});
TableBlockContext.displayName = 'TableBlockContext';

const TableBlockContextBasicValue = createContext<{
  field: any;
  rowKey: string;
  dragSortBy?: string;
  childrenColumnName?: string;
  showIndex?: boolean;
  dragSort?: boolean;
}>(null);
TableBlockContextBasicValue.displayName = 'TableBlockContextBasicValue';

/**
 * @internal
 */
export function getIdsWithChildren(nodes) {
  const ids = [];
  if (nodes) {
    for (const node of nodes) {
      if (node?.children && node.children.length > 0) {
        ids.push(node.id);
        ids.push(...getIdsWithChildren(node?.children));
      }
    }
  }
  return ids;
}
interface Props {
  params?: any;
  showIndex?: boolean;
  dragSort?: boolean;
  rowKey?: string;
  childrenColumnName: any;
  fieldNames?: any;
  /**
   * Table 区块的 collection name
   */
  collection?: string;
  children?: any;
  expandFlag?: boolean;
  dragSortBy?: string;
  association?: string;
  enableIndexColumn?: boolean;
}

const InternalTableBlockProvider = (props: Props) => {
  const {
    params,
    showIndex,
    dragSort,
    rowKey,
    childrenColumnName,
    expandFlag: propsExpandFlag = false,
    fieldNames,
    collection,
    association,
    enableIndexColumn,
  } = props;
  const field: any = useField();
  const { resource, service } = useBlockRequestContext();
  const fieldSchema = useFieldSchema();
  const [expandFlag, setExpandFlag] = useState(fieldNames || propsExpandFlag ? true : false);
  const { heightProps } = useBlockHeightProps();
  const tableElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpandFlag(fieldNames || propsExpandFlag);
  }, [fieldNames || propsExpandFlag]);

  const allIncludesChildren = useMemo(() => {
    const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
    const data = service?.data?.data;
    if (treeTable) {
      const keys = getIdsWithChildren(data);
      return keys;
    }
  }, [service?.loading, fieldSchema]);

  const setExpandFlagValue = useCallback(
    (flag) => {
      setExpandFlag(flag || !expandFlag);
    },
    [expandFlag],
  );

  // Split from value to prevent unnecessary re-renders
  const basicValue = useMemo(
    () => ({
      field,
      rowKey,
      childrenColumnName,
      showIndex,
      dragSort,
      dragSortBy: props.dragSortBy,
    }),
    [field, rowKey, childrenColumnName, showIndex, dragSort, props.dragSortBy],
  );

  // Keep the original for compatibility
  const value = useMemo(
    () => ({
      collection,
      field,
      service,
      resource,
      params,
      showIndex,
      dragSort,
      rowKey,
      expandFlag,
      childrenColumnName,
      allIncludesChildren,
      setExpandFlag: setExpandFlagValue,
      heightProps,
      association,
      enableIndexColumn,
    }),
    [
      allIncludesChildren,
      childrenColumnName,
      collection,
      dragSort,
      expandFlag,
      field,
      heightProps,
      params,
      resource,
      rowKey,
      service,
      setExpandFlagValue,
      showIndex,
      association,
      enableIndexColumn,
    ],
  );

  return (
    <TableElementRefContext.Provider value={tableElementRef}>
      <TableBlockContext.Provider value={value}>
        <TableBlockContextBasicValue.Provider value={basicValue}>{props.children}</TableBlockContextBasicValue.Provider>
      </TableBlockContext.Provider>
    </TableElementRefContext.Provider>
  );
};

/**
 * @internal
 * 用于兼容旧版本的 schema，当不需要兼容时可直接移除该方法
 * @param props
 * @returns
 */
const useTableBlockParamsCompat = (props) => {
  const fieldSchema = useFieldSchema();

  let params,
    parseVariableLoading = false;
  // 1. 新版本的 schema 存在 x-use-decorator-props 属性
  if (fieldSchema['x-use-decorator-props']) {
    params = props.params;
    parseVariableLoading = props.parseVariableLoading;
  } else {
    // 2. 旧版本的 schema 不存在 x-use-decorator-props 属性
    // 因为 schema 中是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tableBlockParams = useTableBlockParams(props);
    params = tableBlockParams.params;
    parseVariableLoading = tableBlockParams.parseVariableLoading;
  }

  return { params, parseVariableLoading };
};

export const TableBlockProvider = withDynamicSchemaProps((props) => {
  const resourceName = props.resource || props.association;

  const fieldSchema = useFieldSchema();
  const { getCollection, getCollectionField } = useCollectionManager_deprecated(props.dataSource);
  const collection = getCollection(props.collection, props.dataSource);
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  const { params, parseVariableLoading } = useTableBlockParamsCompat(props);
  // Prevent tables with 'children' field from automatically converting to tree-structured tables
  let childrenColumnName = '__nochildren__';

  if (treeTable) {
    childrenColumnName = 'children';

    if (resourceName?.includes('.')) {
      const f = getCollectionField(resourceName);
      if (f?.treeChildren) {
        childrenColumnName = f.name;
      }
      params['tree'] = true;
    } else {
      const f = collection?.fields.find((f) => f.treeChildren);
      if (f) {
        childrenColumnName = f.name;
      }
      params['tree'] = true;
    }
  } else {
    childrenColumnName = '__nochildren__';
  }
  const form = useMemo(() => createForm(), [treeTable]);

  // 在解析变量的时候不渲染，避免因为重复请求数据导致的资源浪费
  if (parseVariableLoading) {
    return null;
  }

  return (
    <SchemaComponentOptions scope={{ treeTable }}>
      <FormContext.Provider value={form}>
        <BlockProvider name={props.name || 'table'} {...props} params={params} runWhenParamsChanged>
          <InternalTableBlockProvider {...props} childrenColumnName={childrenColumnName} params={params} />
        </BlockProvider>
      </FormContext.Provider>
    </SchemaComponentOptions>
  );
});

/**
 * @internal
 */
export const useTableBlockContext = () => {
  return useContext(TableBlockContext);
};

/**
 * @internal
 */
export const useTableBlockContextBasicValue = () => {
  return useContext(TableBlockContextBasicValue);
};
