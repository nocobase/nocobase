import { ArrayField, createForm } from '@formily/core';
import { FormContext, Schema, useField, useFieldSchema } from '@formily/react';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCollectionManager } from '../collection-manager';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { useFixedSchema } from '../schema-component';
import { SchemaInitializerContext } from '../schema-initializer';
import { flat } from './TableFieldProvider';

export const TableBlockContext = createContext<any>({});

const InternalTableBlockProvider = (props) => {
  const { params, showIndex, dragSort, rowKey = 'id' } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [expandCount, setExpandCount] = useState(0);
  const [collapseCount, setCollapseCount] = useState(0);
  const treeTable = useContext(IsTreeTableContext);
  // if (service.loading) {
  //   return <Spin />;
  // }
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
        rowKey: treeTable ? '__index' : rowKey,
        idKey: rowKey,
        expandCount,
        setExpandCount: () => setExpandCount(expandCount + 1),
        collapseCount,
        setCollapseCount: () => setCollapseCount(expandCount + 1),
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

export const IsTreeTableContext = createContext(false);

export const TableBlockProvider = (props) => {
  const params = { ...props.params };
  const appends = useAssociationNames(props.collection);
  const form = useMemo(() => createForm(), []);
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  if (props.treeTable) {
    params['tree'] = true;
    params.filter = {
      ...(params.filter ?? {}),
      parentId: params.filter?.parentId ?? null,
    };
  }
  return (
    <FormContext.Provider value={form}>
      <IsTreeTableContext.Provider value={props.treeTable}>
        <BlockProvider {...props} params={params}>
          <InternalTableBlockProvider {...props} params={params} />
        </BlockProvider>
      </IsTreeTableContext.Provider>
    </FormContext.Provider>
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
  const treeTable = useContext(IsTreeTableContext);

  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = ctx?.service?.data?.meta?.pageSize;
      field.componentProps.pagination.total = ctx?.service?.data?.meta?.count;
      field.componentProps.pagination.current = ctx?.service?.data?.meta?.page;
      if (treeTable) {
        const blockField = ctx.field;
        blockField.value = ctx?.service?.data?.data;
        blockField.data = blockField.data || {};
        blockField.data.selectedRowKeys = ctx?.blockField?.data?.selectedRowKeys;
        blockField.data.dataSource = flat(ctx?.service?.data?.data ?? []);
      }
    }
  }, [ctx?.service?.loading]);
  return {
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    rowKey: ctx.rowKey,
    pagination:
      ctx?.params?.paginate !== false
        ? {
            defaultCurrent: ctx?.params?.page || 1,
            defaultPageSize: ctx?.params?.pageSize,
          }
        : false,
    onRowSelectionChange(selectedRowKeys) {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
    },
    async onRowDragEnd({ from, to }) {
      if (!from || !to) return;
      await ctx.resource.move({
        sourceId: from[ctx.idKey || 'id'],
        targetId: to[ctx.idKey || 'id'],
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
  };
};
