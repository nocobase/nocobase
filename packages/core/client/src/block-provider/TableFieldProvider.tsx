import { ArrayField, Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { APIClient } from '../api-client';
import { useCollectionField, useCollectionManager } from '../collection-manager';
import { useRecord } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';
import { useFormFieldContext } from './FormFieldProvider';
import { IsTreeTableContext, TableBlockContext, useAssociationNames } from './TableBlockProvider';

export const TableFieldContext = createContext<any>({});

const InternalTableFieldProvider = (props) => {
  const { params = {}, showIndex, dragSort, fieldName, rowKey = 'id' } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { resource, service } = useBlockRequestContext();
  const treeTable = useContext(IsTreeTableContext);

  const formBlockCtx = useFormBlockContext();
  const formFieldCtx = useFormFieldContext();

  const fullFieldName = formFieldCtx && formFieldCtx.fieldName ? `${formFieldCtx.fieldName}.${fieldName}` : fieldName;

  if (!formBlockCtx?.updateAssociationValues?.includes(fullFieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fullFieldName);
  }
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <TableFieldContext.Provider
      value={{
        field,
        fieldSchema,
        service,
        resource,
        params,
        showIndex,
        dragSort,
        rowKey: treeTable ? '__index' : rowKey,
        idKey: rowKey,
        treeTable: useIsEnableTree(props),
      }}
    >
      {props.children}
    </TableFieldContext.Provider>
  );
};

export const flat = (tree: any[]) => {
  return tree.reduce((pre, cur) => {
    return pre.concat(cur, flat(cur.children ?? []));
  }, []);
};

export const toTree = (adjacencyList) => {
  const buildSubtree = (node) => {
    const parentIndex = node.__index;
    return {
      ...node,
      children: adjacencyList
        .filter(
          (i) =>
            i.__index.length > parentIndex.length &&
            i.__index.startsWith(parentIndex) &&
            !i.__index.replace(`${parentIndex}.children.`, '').includes('.'),
        )
        .map(buildSubtree),
    };
  };
  return adjacencyList.filter((i) => !i.__index.includes('.')).map(buildSubtree);
};

export class TableFieldResource {
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
          data: options.tree ? toTree(this.field.data.dataSource) : this.field.data.dataSource,
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
    this.field.data.dataSource = options.tree ? flat(response.data.data) : response.data.data;
    return {
      data: {
        data: response.data.data,
      },
    };
  }

  async get(options) {
    console.log('get', options);
    const { filterByTk, treeTable } = options;
    return {
      data: {
        data: treeTable
          ? this.field.data.dataSource.find((i) => i.__index == filterByTk)
          : this.field.data.dataSource[filterByTk],
      },
    };
  }

  async create(options) {
    console.log('create', options);
    const { values, treeTable } = options;
    if (treeTable) {
      const tops = this.field.data.dataSource.filter((i) => !i.__index.includes('.')).length;
      this.field.data.dataSource = this.field.data.dataSource.concat({
        ...values,
        __index:
          (values.parent?.__parent && Object.keys(values.parent?.__parent).length === 0) || !values.parent?.__index
            ? String(tops)
            : `${values.parent?.__index}.children.${values.parent.children?.length ?? 0}`,
      });
    } else {
      this.field.data.dataSource = this.field.data.dataSource.concat(values);
    }
    this.field.data.changed = true;
  }

  async update(options) {
    console.log('update', options);
    const { filterByTk, values, treeTable } = options;

    if (treeTable) {
      const parentId = values.parent.id;
      const parentIndex = this.field.data.dataSource.find((i) => i.id === parentId).__index;
      const parentChildrenLen = (values.parent.children ?? []).length;

      values.__index = `${parentIndex}.children.${parentChildrenLen}`;

      const writeChildrenIndex = (node) => {
        (node.children ?? []).forEach((i, index) => {
          i.__index = `${node.__index}.children.${index}`;
          writeChildrenIndex(i);
        });
      };

      writeChildrenIndex(values);

      this.field.data.dataSource = this.field.data.dataSource.map((i, index) =>
        treeTable && filterByTk === i.__index ? values : index === filterByTk ? values : i,
      );
    } else {
      this.field.data.dataSource = this.field.data.dataSource.map((i, index) => (index === filterByTk ? values : i));
    }
    this.field.data.changed = true;
  }

  async destroy(options) {
    console.log('destroy', options);
    let { filterByTk, idKey, treeTable } = options;
    if (!Array.isArray(filterByTk)) {
      filterByTk = [filterByTk];
    }
    this.field.data.dataSource = this.field.data.dataSource.filter((item, index) => {
      return !filterByTk.includes(treeTable && idKey ? item[idKey] ?? item.__index : index);
    });
    this.field.data.changed = true;
  }
}

export const WithoutTableFieldResource = createContext(null);

export const TableFieldProvider = (props) => {
  const params = { ...props.params };
  if (useIsEnableTree(props)) {
    params.tree = true;
    params.filter = {
      ...(params.filter ?? {}),
      parentId: useRecord()?.id ?? null,
    };
    params.appends = params.appends ?? useAssociationNames(props.collection).filter((i) => i !== 'children');
  }
  return (
    <WithoutTableFieldResource.Provider value={false}>
      <BlockProvider block={'TableField'} {...props} params={params}>
        <InternalTableFieldProvider {...props} />
      </BlockProvider>
    </WithoutTableFieldResource.Provider>
  );
};

export const useTableFieldContext = () => {
  return useContext(TableFieldContext);
};

export const useTableFieldProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTableFieldContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
    }
  }, [ctx?.service?.loading]);
  return {
    ...ctx,
    size: 'middle',
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    pagination: false,
    required: ctx?.fieldSchema?.parent?.required,
    onRowSelectionChange(selectedRowKeys) {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
    },
    onChange({ current, pageSize }) {
      ctx.service.run({ page: current, pageSize });
    },
  };
};

const useIsEnableTree = (props) => {
  const { getCollection } = useCollectionManager();

  return getCollection(props.collection).tree === 'adjacencyList';
};
