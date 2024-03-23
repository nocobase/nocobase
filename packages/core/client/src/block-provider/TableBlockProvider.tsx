import { createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCollectionManager_deprecated } from '../collection-manager';
import { FixedBlockWrapper, SchemaComponentOptions } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';
import { useTableBlockParams } from '../modules/blocks/data-blocks/table/hooks/useTableBlockDecoratorProps';
import { withDynamicSchemaProps } from '../application/hoc/withDynamicSchemaProps';

export const TableBlockContext = createContext<any>({});
TableBlockContext.displayName = 'TableBlockContext';

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
}

const InternalTableBlockProvider = (props: Props) => {
  const { params, showIndex, dragSort, rowKey, childrenColumnName, fieldNames, ...others } = props;
  const field: any = useField();
  const { resource, service } = useBlockRequestContext();
  const fieldSchema = useFieldSchema();
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  const [expandFlag, setExpandFlag] = useState(fieldNames ? true : false);
  const allIncludesChildren = useMemo(() => {
    if (treeTable !== false) {
      const keys = getIdsWithChildren(service?.data?.data);
      return keys || [];
    }
  }, [service?.loading]);

  return (
    <FixedBlockWrapper>
      <TableBlockContext.Provider
        value={{
          ...others,
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
          setExpandFlag: () => setExpandFlag(!expandFlag),
        }}
      >
        <RenderChildrenWithAssociationFilter {...props} />
      </TableBlockContext.Provider>
    </FixedBlockWrapper>
  );
};

/**
 * 用于兼容旧版本的 schema，当不需要兼容时可直接移除该方法
 * @param props
 * @returns
 */
const useTableBlockParamsCompat = (props) => {
  const fieldSchema = useFieldSchema();

  let params;
  // 1. 新版本的 schema 存在 x-use-decorator-props 属性
  if (fieldSchema['x-use-decorator-props']) {
    params = props.params;
  } else {
    // 2. 旧版本的 schema 不存在 x-use-decorator-props 属性
    // 因为 schema 中是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    params = useTableBlockParams(props);
  }

  return params;
};

export const TableBlockProvider = withDynamicSchemaProps((props) => {
  const resourceName = props.resource || props.association;

  const fieldSchema = useFieldSchema();
  const { getCollection, getCollectionField } = useCollectionManager_deprecated(props.dataSource);
  const collection = getCollection(props.collection, props.dataSource);
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  const params = useTableBlockParamsCompat(props);

  let childrenColumnName = 'children';
  if (collection?.tree && treeTable !== false) {
    if (resourceName?.includes('.')) {
      const f = getCollectionField(resourceName);
      if (f?.treeChildren) {
        childrenColumnName = f.name;
        params['tree'] = true;
      }
    } else {
      const f = collection.fields.find((f) => f.treeChildren);
      if (f) {
        childrenColumnName = f.name;
      }
      params['tree'] = true;
    }
  }
  const form = useMemo(() => createForm(), [treeTable]);

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

export const useTableBlockContext = () => {
  return useContext(TableBlockContext);
};
