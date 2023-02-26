import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect } from 'react';
import { useCollectionManager } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';
import { IsTreeTableContext } from './TableBlockProvider';

export const TableSelectorContext = createContext<any>({});

const InternalTableSelectorProvider = (props) => {
  const { params, rowKey, extraFilter } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <RecordProvider record={{}}>
      <IsTreeTableContext.Provider value={!!useIsEnableTree(props)}>
        <TableSelectorContext.Provider
          value={{
            field,
            service,
            resource,
            params,
            extraFilter,
            rowKey,
          }}
        >
          <RenderChildrenWithAssociationFilter {...props} />
        </TableSelectorContext.Provider>
      </IsTreeTableContext.Provider>
    </RecordProvider>
  );
};

const useAssociationNames2 = (collection) => {
  const { getCollectionFields } = useCollectionManager();
  const names = getCollectionFields(collection)
    ?.filter((field) => field.target)
    .map((field) => field.name);
  return names;
};

const recursiveParent = (schema: Schema, component) => {
  return schema['x-component'] === component
    ? schema
    : schema.parent
    ? recursiveParent(schema.parent, component)
    : null;
};

const useAssociationNames = (collection) => {
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
    if (schema['x-component'] === 'TableV2.Selector') {
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

export const TableSelectorProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const ctx = useFormBlockContext();
  const { getCollectionJoinField, getCollectionFields } = useCollectionManager();
  const record = useRecord();

  const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
  // const value = ctx.form.query(collectionFieldSchema?.name).value();
  const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);

  const params = { ...props.params };
  const appends = useAssociationNames(props.collection);
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  if (useIsEnableTree(props)) {
    params.tree = true;
    params.filter = {
      ...(params.filter ?? {}),
      parentId: useActionContext().action === 'update' ? null : record?.id ?? null,
    };
    params.appends = params.appends ?? useAssociationNames(props.collection).filter((i) => i !== 'children');
  }
  let extraFilter;
  if (collectionField) {
    if (['oho', 'o2m'].includes(collectionField.interface)) {
      if (record?.[collectionField.sourceKey]) {
        extraFilter = {
          $or: [
            {
              [collectionField.foreignKey]: {
                $is: null,
              },
            },
            {
              [collectionField.foreignKey]: {
                $eq: record?.[collectionField.sourceKey],
              },
            },
          ],
        };
      } else {
        extraFilter = {
          [collectionField.foreignKey]: {
            $is: null,
          },
        };
      }
    }
    if (['obo'].includes(collectionField.interface)) {
      const fields = getCollectionFields(collectionField.target);
      const targetField = fields.find((f) => f.foreignKey && f.foreignKey === collectionField.foreignKey);
      if (targetField) {
        if (record?.[collectionField.foreignKey]) {
          extraFilter = {
            $or: [
              {
                [`${targetField.name}.${targetField.foreignKey}`]: {
                  $is: null,
                },
              },
              {
                [`${targetField.name}.${targetField.foreignKey}`]: {
                  $eq: record?.[collectionField.foreignKey],
                },
              },
            ],
          };
        } else {
          extraFilter = {
            [`${targetField.name}.${targetField.foreignKey}`]: {
              $is: null,
            },
          };
        }
      }
    }
  }

  if (extraFilter) {
    if (params?.filter) {
      params['filter'] = {
        $and: [extraFilter, params['filter']],
      };
    } else {
      params['filter'] = extraFilter;
    }
  }
  return (
    <BlockProvider {...props} params={params}>
      <InternalTableSelectorProvider {...props} params={params} extraFilter={extraFilter} />
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

  const rowkey = useContext(IsTreeTableContext) ? '__index' : ctx.rowKey || 'id';

  return {
    loading: ctx?.service?.loading,
    showIndex: false,
    dragSort: false,
    rowKey: rowkey,
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
        sourceId: from[rowkey],
        targetId: to[rowkey],
      });
      ctx.service.refresh();
    },
    onChange({ current, pageSize }) {
      ctx.service.run({ ...ctx.service.params?.[0], page: current, pageSize });
    },
  };
};

const useIsEnableTree = (props) => {
  const { getCollection } = useCollectionManager();
  return getCollection(props.collection).tree === 'adjacencyList';
};
