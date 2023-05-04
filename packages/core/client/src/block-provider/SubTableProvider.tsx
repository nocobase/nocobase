import { ArrayField, Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { APIClient } from '../api-client';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';
import { useFormFieldContext } from './FormFieldProvider';
import { useCollection } from '../collection-manager';

export const SubTableContext = createContext<any>({});

const InternalSubTableProvider = (props) => {
  const { params = {}, showIndex, dragSort, fieldName } = props;
  const fieldSchema = useFieldSchema();
  const field: any = useField<Field>();

  const { resource, service } = useBlockRequestContext();
  const formBlockCtx = useFormBlockContext();
  const formFieldCtx = useFormFieldContext();

  const fullFieldName = formFieldCtx && formFieldCtx.fieldName ? `${formFieldCtx.fieldName}.${fieldName}` : fieldName;

  if (!formBlockCtx?.updateAssociationValues?.includes(fullFieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fullFieldName);
  }
  return (
    <SubTableContext.Provider
      value={{
        field,
        fieldSchema,
        service,
        resource,
        params,
        showIndex,
        dragSort,
      }}
    >
      {props.children}
    </SubTableContext.Provider>
  );
};

export class SubTableResource {
  field: Field;
  api: APIClient;
  sourceId: any;
  resource?: any;

  constructor(options) {
    this.field = options.field;
    this.api = options.api;
    this.sourceId = options.sourceId;
    this.resource = this.api.resource(options.resource, this.sourceId);
  }

  async list(options) {
    this.field.data = this.field.data || {};
    if (this.field.data.changed) {
      console.log('list.dataSource', this.field.data.dataSource);
      return {
        data: {
          data: this.field.data.dataSource,
        },
      };
    }
    if (!this.sourceId) {
      console.log('list.sourceId', this.field.data.dataSource);
      this.field.data.dataSource = [];
      return {
        data: {
          data: [],
        },
      };
    }
    const response = await this.resource.list(options);
    console.log('list', response);
    this.field.data.dataSource = response.data.data;
    return {
      data: {
        data: response.data.data,
      },
    };
  }

  async get(options) {
    console.log('get', options);
    const { filterByTk } = options;
    return {
      data: {
        data: this.field.data.dataSource[filterByTk],
      },
    };
  }

  async create(options) {
    console.log('create', options);
    const { values } = options;
    this.field.data.dataSource.push(values);
    this.field.data.changed = true;
  }

  async update(options) {
    console.log('update', options);
    const { filterByTk, values } = options;
    this.field.data.dataSource[filterByTk] = values;
    this.field.data.changed = true;
  }

  async destroy(options) {
    console.log('destroy', options);
    let { filterByTk } = options;
    if (!Array.isArray(filterByTk)) {
      filterByTk = [filterByTk];
    }
    this.field.data.dataSource = this.field.data.dataSource.filter((item, index) => {
      return !filterByTk.includes(index);
    });
    this.field.data.changed = true;
  }
}

export const WithoutSubTableResource = createContext(null);

export const SubTableProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema?.parent?.name);
  const subprops = {
    ...props,
    collection: collectionField?.target,
    association: `${collectionField.collectionName}.${collectionField.name}`,
    resource: `${collectionField.collectionName}.${collectionField.name}`,
    action: 'list',
    params: {
      paginate: false,
    },
    showIndex: true,
    dragSort: false,
  };
  return (
    <BlockProvider block={'SubTable'} {...subprops}>
      <InternalSubTableProvider {...subprops} />
    </BlockProvider>
  );
};

export const useSubTableContext = () => {
  return useContext(SubTableContext);
};

export const useSubTableProps = () => {
  const field = useField<ArrayField>();
  const ctx = useSubTableContext();
  console.log(field.props.name);
  useEffect(() => {
    if (!ctx?.service?.loading) {
      // field.value = ctx?.service?.data?.data;
      field.value = new Proxy([{ id: 2 }], {});
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
      console.log(field.value, field);
    }
  }, [ctx?.service?.loading]);
  return {
    size: 'middle',
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    pagination: false,
    required: ctx?.fieldSchema?.parent?.required,
    rowKey: (record: any) => {
      return field.value?.indexOf?.(record);
    },
    onRowSelectionChange(selectedRowKeys) {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
    },
    onChange({ current, pageSize }) {
      ctx.service.run({ page: current, pageSize });
    },
  };
};
