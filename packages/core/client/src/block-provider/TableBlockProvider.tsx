import { ArrayField, createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../collection-manager';
import { useFilterBlock } from '../filter-provider/FilterProvider';
import { FixedBlockWrapper, SchemaComponentOptions, removeNullCondition } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { mergeFilter } from './SharedFilterProvider';
import { findFilterTargets } from './hooks';

export const TableBlockContext = createContext<any>({});
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

export const TableBlockProvider = (props) => {
  const resourceName = props.resource;
  const params = { ...props.params };
  const fieldSchema = useFieldSchema();
  const { getCollection, getCollectionField } = useCollectionManager();
  const collection = getCollection(props.collection);
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
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
        <BlockProvider data-testid="table-block" {...props} params={params} runWhenParamsChanged>
          <InternalTableBlockProvider {...props} childrenColumnName={childrenColumnName} params={params} />
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

  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = [];
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = ctx?.service?.data?.meta?.pageSize;
      field.componentProps.pagination.total = ctx?.service?.data?.meta?.count;
      field.componentProps.pagination.current = ctx?.service?.data?.meta?.page;
    }
  }, [ctx?.service?.loading]);
  return {
    childrenColumnName: ctx.childrenColumnName,
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    rowKey: ctx.rowKey || 'id',
    pagination:
      ctx?.params?.paginate !== false
        ? {
            defaultCurrent: ctx?.params?.page || 1,
            defaultPageSize: ctx?.params?.pageSize,
          }
        : false,
    onRowSelectionChange(selectedRowKeys) {
      console.log(selectedRowKeys);
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
      ctx?.field?.onRowSelect?.(selectedRowKeys);
    },
    async onRowDragEnd({ from, to }) {
      await ctx.resource.move({
        sourceId: from[ctx.rowKey || 'id'],
        targetId: to[ctx.rowKey || 'id'],
      });
      ctx.service.refresh();
    },
    onChange({ current, pageSize }, filters, sorter) {
      const sort = sorter.order
        ? sorter.order === `ascend`
          ? [sorter.field]
          : [`-${sorter.field}`]
        : globalSort || ctx.service.params?.[0]?.sort;
      ctx.service.run({ ...ctx.service.params?.[0], page: current, pageSize, sort });
    },
    onClickRow(record, setSelectedRow, selectedRow) {
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
    onExpand(expanded, record) {
      ctx?.field.onExpandClick?.(expanded, record);
    },
  };
};
