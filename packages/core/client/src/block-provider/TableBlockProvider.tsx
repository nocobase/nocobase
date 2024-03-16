import { ArrayField, createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCollectionManager_deprecated } from '../collection-manager';
import { useFilterBlock } from '../filter-provider/FilterProvider';
import { mergeFilter } from '../filter-provider/utils';
import { FixedBlockWrapper, SchemaComponentOptions, removeNullCondition } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { findFilterTargets, useParsedFilter } from './hooks';
import { isEqual } from 'lodash';
import { useDeepMemoized } from '../application';
import { useWhyDidYouUpdate } from 'ahooks';

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
  const [expandFlag, setExpandFlag] = useState(fieldNames ? true : false);
  const data = useDeepMemoized(service?.data?.data);
  const allIncludesChildren = useMemo(() => {
    const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
    if (treeTable !== false) {
      const keys = getIdsWithChildren(data);
      return keys;
    }
  }, [data, fieldSchema]);

  const setExpandFlagValue = useCallback(() => {
    setExpandFlag(!expandFlag);
  }, [expandFlag]);

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
          setExpandFlag: setExpandFlagValue,
        }}
      >
        <RenderChildrenWithAssociationFilter {...props} />
      </TableBlockContext.Provider>
    </FixedBlockWrapper>
  );
};

export const TableBlockProvider = (props) => {
  const resourceName = props.resource;
  const fieldSchema = useFieldSchema();
  const { getCollection, getCollectionField } = useCollectionManager_deprecated(props.dataSource);
  const collection = getCollection(props.collection, props.dataSource);
  const { treeTable, dragSortBy } = useMemo(() => fieldSchema?.['x-decorator-props'] || {}, [fieldSchema]);
  const isTree = collection?.tree && treeTable !== false;

  const treeField = useMemo(() => {
    if (isTree) {
      if (resourceName?.includes('.')) {
        return getCollectionField(resourceName);
      } else {
        return collection.fields.find((f) => f.treeChildren);
      }
    }
  }, [resourceName, isTree, collection?.fields, getCollectionField]);

  const childrenColumnName = treeField?.name || 'children';

  const params = useMemo(() => {
    return {
      ...props.params,
      tree: isTree && treeField?.treeChildren,
      sort: props.dragSort && dragSortBy ? dragSortBy : undefined,
    };
  }, [isTree, props.params, props.dragSort, dragSortBy, treeField?.treeChildren]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const form = useMemo(() => createForm(), [treeTable]);

  const { filter: parsedFilter } = useParsedFilter({
    filterOption: params?.filter,
  });
  const paramsWithFilter = useMemo(() => {
    return {
      ...params,
      filter: parsedFilter,
    };
  }, [parsedFilter, params]);

  const scope = useMemo(() => ({ treeTable }), [treeTable]);

  return (
    <SchemaComponentOptions scope={scope}>
      <FormContext.Provider value={form}>
        <BlockProvider name={props.name || 'table'} {...props} params={paramsWithFilter} runWhenParamsChanged>
          <InternalTableBlockProvider {...props} childrenColumnName={childrenColumnName} params={paramsWithFilter} />
        </BlockProvider>
      </FormContext.Provider>
    </SchemaComponentOptions>
  );
};

export const useTableBlockContext = () => {
  return useContext(TableBlockContext);
};

export const useTableBlockProps = () => {
  const field = useField<ArrayField>();
  const fieldSchema = useFieldSchema();
  const ctx = useTableBlockContext();
  const globalSort = fieldSchema.parent?.['x-decorator-props']?.['params']?.['sort'];
  const { getDataBlocks } = useFilterBlock();
  const isLoading = ctx?.service?.loading;
  const serviceResponse = useDeepMemoized(ctx?.service?.data);
  const params = useDeepMemoized(ctx?.service?.params);
  const selectedRowKeys = useDeepMemoized(ctx?.field?.data?.selectedRowKeys);
  useEffect(() => {
    if (!isLoading) {
      const data = serviceResponse?.data || [];
      const meta = serviceResponse?.meta || {};

      if (!isEqual(field.value, data)) {
        field.value = data;
        field?.setInitialValue(data);
      }
      field.data = field.data || {};
      field.data.selectedRowKeys = selectedRowKeys;
      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = meta?.pageSize;
      field.componentProps.pagination.total = meta?.count;
      field.componentProps.pagination.current = meta?.page;
    }
  }, [field, serviceResponse, isLoading, selectedRowKeys]);

  return {
    childrenColumnName: ctx.childrenColumnName,
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort && ctx.dragSortBy,
    rowKey: ctx.rowKey || 'id',
    pagination: useMemo(() => {
      return params?.paginate !== false
        ? {
            defaultCurrent: params?.page || 1,
            defaultPageSize: params?.pageSize,
          }
        : false;
    }, [params?.page, params?.pageSize, params?.paginate]),
    onRowSelectionChange: useCallback((selectedRowKeys) => {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
      ctx?.field?.onRowSelect?.(selectedRowKeys);
    }, []),
    onRowDragEnd: useCallback(
      async ({ from, to }) => {
        await ctx.resource.move({
          sourceId: from[ctx.rowKey || 'id'],
          targetId: to[ctx.rowKey || 'id'],
          sortField: ctx.dragSort && ctx.dragSortBy,
        });
        ctx.service.refresh();
        // ctx.resource
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [ctx.rowKey, ctx.dragSort, ctx.dragSortBy],
    ),
    onChange: useCallback(
      ({ current, pageSize }, filters, sorter) => {
        const sort = sorter.order ? (sorter.order === `ascend` ? [sorter.field] : [`-${sorter.field}`]) : globalSort;
        ctx.service.run({ ...params?.[0], page: current, pageSize, sort });
        // ctx.service
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [globalSort, params],
    ),
    onClickRow: useCallback(
      (record, setSelectedRow, selectedRow) => {
        const { targets, uid } = findFilterTargets(fieldSchema);
        const dataBlocks = getDataBlocks();

        // 如果是之前创建的区块是没有 x-filter-targets 属性的，所以这里需要判断一下避免报错
        if (!targets || !targets.some((target) => dataBlocks.some((dataBlock) => dataBlock.uid === target.uid))) {
          // 当用户已经点击过某一行，如果此时再把相连接的区块给删除的话，行的高亮状态就会一直保留。
          // 这里暂时没有什么比较好的方法，只是在用户再次点击的时候，把高亮状态给清除掉。
          setSelectedRow((prev) => (prev.length ? [] : prev));
          return;
        }

        const value = [record[ctx.rowKey]];

        dataBlocks.forEach((block) => {
          const target = targets.find((target) => target.uid === block.uid);
          if (!target) return;

          const param = block.service.params?.[0] || {};
          // 保留原有的 filter
          const storedFilter = block.service.params?.[1]?.filters || {};

          if (selectedRow.includes(record[ctx.rowKey])) {
            if (block.dataLoadingMode === 'manual') {
              return block.clearData();
            }
            delete storedFilter[uid];
          } else {
            storedFilter[uid] = {
              $and: [
                {
                  [target.field || ctx.rowKey]: {
                    [target.field ? '$in' : '$eq']: value,
                  },
                },
              ],
            };
          }

          const mergedFilter = mergeFilter([
            ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
            block.defaultFilter,
          ]);

          return block.doFilter(
            {
              ...param,
              page: 1,
              filter: mergedFilter,
            },
            { filters: storedFilter },
          );
        });

        // 更新表格的选中状态
        setSelectedRow((prev) => (prev?.includes(record[ctx.rowKey]) ? [] : [...value]));
      },
      [ctx.rowKey, fieldSchema, getDataBlocks],
    ),
    onExpand: useCallback((expanded, record) => {
      ctx?.field.onExpandClick?.(expanded, record);
    }, []),
  };
};
