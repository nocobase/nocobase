import { ArrayField, createForm } from '@formily/core';
import { FormContext, Schema, useField, useFieldSchema } from '@formily/react';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../collection-manager';
import { SchemaComponentOptions, useFixedSchema, removeNullCondition } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { useFilterBlock } from '../filter-provider/FilterProvider';
import { findFilterTargets } from './hooks';
import { mergeFilter } from './SharedFilterProvider';

export const TableBlockContext = createContext<any>({});

interface Props {
  params?: any;
  showIndex?: boolean;
  dragSort?: boolean;
  rowKey?: string;
  /** 目前可能的值仅为 'filter'，用于区分筛选区块和数据区块 */
  blockType?: 'filter';
  childrenColumnName: any;
}

const InternalTableBlockProvider = (props: Props) => {
  const { params, showIndex, dragSort, rowKey, childrenColumnName, blockType } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [expandFlag, setExpandFlag] = useState(false);
  useFixedSchema();
  return (
    <TableBlockContext.Provider
      value={{
        field,
        service,
        resource,
        params,
        showIndex,
        dragSort,
        rowKey,
        expandFlag,
        childrenColumnName,
        setExpandFlag: () => setExpandFlag(!expandFlag),
        blockType,
      }}
    >
      <RenderChildrenWithAssociationFilter {...props} />
    </TableBlockContext.Provider>
  );
};

export const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager();
  const collectionFields = getCollectionFields(collection);
  const associationFields = new Set();
  for (const collectionField of collectionFields) {
    if (collectionField.target) {
      associationFields.add(collectionField.name);
      const fields = getCollectionFields(collectionField.target);
      for (const field of fields) {
        if (field.target) {
          associationFields.add(`${collectionField.name}.${field.name}`);
        }
      }
    }
  }
  const fieldSchema = useFieldSchema();
  const tableSchema = fieldSchema.reduceProperties((buf, schema) => {
    if (schema['x-component'] === 'TableV2') {
      return schema;
    }
    return buf;
  }, new Schema({}));
  return uniq(
    tableSchema.reduceProperties((buf, schema) => {
      if (schema['x-component'] === 'TableV2.Column') {
        const s = schema.reduceProperties((buf, s) => {
          const [name] = (s.name as string).split('.');
          if (s['x-collection-field'] && associationFields.has(name)) {
            return s;
          }
          return buf;
        }, null);
        if (s) {
          // 关联字段和关联的关联字段
          const [firstName] = s.name.split('.');
          if (associationFields.has(s.name)) {
            buf.push(s.name);
          } else if (associationFields.has(firstName)) {
            buf.push(firstName);
          }
        }
      }
      return buf;
    }, []),
  );
};

export const TableBlockProvider = (props) => {
  const resourceName = props.resource;
  const params = { ...props.params };
  const appends = useAssociationNames(props.collection);
  const fieldSchema = useFieldSchema();
  const { getCollection, getCollectionField } = useCollectionManager();
  const collection = getCollection(props.collection);
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  let childrenColumnName = 'children';
  if (collection?.tree && treeTable !== false) {
    if (resourceName.includes('.')) {
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
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  const form = useMemo(() => createForm(), [treeTable]);
  return (
    <SchemaComponentOptions scope={{ treeTable }}>
      <FormContext.Provider value={form}>
        <BlockProvider {...props} params={params}>
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
    },
    async onRowDragEnd({ from, to }) {
      await ctx.resource.move({
        sourceId: from[ctx.rowKey || 'id'],
        targetId: to[ctx.rowKey || 'id'],
      });
      ctx.service.refresh();
    },
    onChange({ current, pageSize }, filters, sorter) {
      let sort = sorter.order
        ? sorter.order === `ascend`
          ? [sorter.field]
          : [`-${sorter.field}`]
        : globalSort || ctx.service.params?.[0]?.sort;
      ctx.service.run({ ...ctx.service.params?.[0], page: current, pageSize, sort });
    },
    onClickRow(record, setSelectedRow, selectedRow) {
      if (ctx.blockType !== 'filter') return;

      const value = [record[ctx.rowKey]];
      const { targets, uid } = findFilterTargets(fieldSchema);

      getDataBlocks().forEach((block) => {
        const target = targets.find((target) => target.name === block.uid);
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
  };
};
