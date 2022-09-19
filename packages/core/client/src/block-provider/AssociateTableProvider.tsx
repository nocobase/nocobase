import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { useCollectionManager } from '../collection-manager';
import { useRecord } from '../record-provider';
import { BlockProvider, useBlockRequestContext, useBlockAssociationContext } from './BlockProvider';

const AssociateTableSelectorContext = createContext<any>({});

const InternalTableSelectorProvider = (props) => {
  const { params, rowKey } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  return (
    <AssociateTableSelectorContext.Provider
      value={{
        field,
        service,
        resource,
        params,
        rowKey,
      }}
    >
      {props.children}
    </AssociateTableSelectorContext.Provider>
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
  return schema['x-initializer'] === component
    ? schema
    : schema.parent
    ? recursiveParent(schema.parent, component)
    : null;
};

export const AssociateTableProvider = (props) => {
  const { getCollectionJoinField } = useCollectionManager();
  const association = useBlockAssociationContext();
  const record = useRecord();
  const targetField = getCollectionJoinField(association);
  const params = {
    ...props.params,
  };
  if (targetField) {
    if (['o2m'].includes(targetField.interface)) {
      if (record[targetField.sourceKey]) {
        params['filter'] = { [targetField.foreignKey]: { $notExists: record[targetField.sourceKey] } };
      }
    }
  }

  const appends = useAssociationNames(props.collection);
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }

  return (
    <BlockProvider {...props} params={params} association={association}>
      <InternalTableSelectorProvider {...props} params={params} />
    </BlockProvider>
  );
};

export const useAssociateTableSelectorContext = () => {
  return useContext(AssociateTableSelectorContext);
};

export const useAssociateTableSelectorProps = () => {
  const field = useField<ArrayField>();
  const ctx = useAssociateTableSelectorContext();
  const {__parent}=useBlockRequestContext();
  const rcSelectRows=__parent.service.data.data
  const selectKeys=rcSelectRows?.map((item) => item[ctx.rowKey || 'id'])
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
      ctx.field.selectedRowKeys = selectedRowKeys;
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
    getCheckboxProps: (record) => ({
      disabled: selectKeys.includes(record[ctx.rowKey||'id']), // Column configuration not to be checked
    }),
  };
};
