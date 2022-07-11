import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { useCollection, useCollectionManager } from '../collection-manager';
import { useRecord } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';

export const TableSelectorContext = createContext<any>({});

const InternalTableSelectorProvider = (props) => {
  const { params, rowKey } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <TableSelectorContext.Provider
      value={{
        field,
        service,
        resource,
        params,
        rowKey,
      }}
    >
      {props.children}
    </TableSelectorContext.Provider>
  );
};

const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager();
  const names = getCollectionFields(collection)
    ?.filter((field) => field.target)
    .map((field) => field.name);
  return names;
};

const recursiveParent = (schema: Schema, component) => {
  return schema['x-component'] === component 
    ? schema 
    : (schema.parent ? recursiveParent(schema.parent, component) : null);
}

export const TableSelectorProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const ctx = useFormBlockContext()
  const { getCollectionJoinField, getCollectionFields } = useCollectionManager();
  const record = useRecord();

  const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
  // const value = ctx.form.query(collectionFieldSchema?.name).value();
  const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);
  
  console.log('TableSelectorProvider', collectionFieldSchema, collectionField, record);
  const params = { ...props.params };
  const appends = useAssociationNames(props.collection);
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  if (appends?.length) {
    params['appends'] = appends;
  }
  if (collectionField) {
    if (['oho', 'o2m'].includes(collectionField.interface)) {
      if (record?.[collectionField.sourceKey]) {
        params['filter'] = {
          $or: [{
            [collectionField.foreignKey]: {
              $is: null,
            }
          }, {
            [collectionField.foreignKey]: {
              $eq: record?.[collectionField.sourceKey],
            }
          }]
        }
      } else {
        params['filter'] = {
          [collectionField.foreignKey]: {
            $is: null,
          }
        }
      }
    }
    if (['obo'].includes(collectionField.interface)) {
      const fields = getCollectionFields(collectionField.target);
      const targetField = fields.find(f => f.foreignKey && f.foreignKey === collectionField.foreignKey);
      if (targetField) {
        if (record?.[collectionField.foreignKey]) {
          params['filter'] = {
            $or: [{
              [`${targetField.name}.${targetField.foreignKey}`]: {
                $is: null,
              }
            }, {
              [`${targetField.name}.${targetField.foreignKey}`]: {
                $eq: record?.[collectionField.foreignKey],
              }
            }]
          }
        } else {
          params['filter'] = {
            [`${targetField.name}.${targetField.foreignKey}`]: {
              $is: null,
            }
          }
        }
      }
    }
  }
  return (
    <BlockProvider {...props} params={params}>
      <InternalTableSelectorProvider {...props} params={params} />
    </BlockProvider>
  );
};

export const useTableSelectorContext = () => {
  return useContext(TableSelectorContext);
};

export const useTableSelectorProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTableSelectorContext();
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
    loading: ctx?.service?.loading,
    showIndex: false,
    dragSort: false,
    rowKey: ctx.rowKey || 'id',
    pagination:
      ctx?.params?.paginate !== false
        ? {
            defaultCurrent: ctx?.params?.page || 1,
            defaultPageSize: ctx?.params?.pageSize,
          }
        : false,
    onRowSelectionChange(selectedRowKeys, selectedRows) {
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
    onChange({ current, pageSize }) {
      ctx.service.run({ ...ctx.service.params?.[0], page: current, pageSize });
    },
  };
};
