import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCollectionManager_deprecated } from '../collection-manager';
import { useCollectionParentRecordData } from '../data-source/collection-record/CollectionRecordProvider';
import { isInFilterFormBlock } from '../filter-provider';
import { mergeFilter } from '../filter-provider/utils';
import { RecordProvider, useRecord } from '../record-provider';
import { SchemaComponentOptions } from '../schema-component';
import { BlockProvider, RenderChildrenWithAssociationFilter, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';
import { withDynamicSchemaProps } from '../application/hoc/withDynamicSchemaProps';

type Params = {
  filter?: any;
  pageSize?: number;
  page?: number;
  sort?: any;
};

export const TableSelectorContext = createContext<any>({});
TableSelectorContext.displayName = 'TableSelectorContext';
const TableSelectorParamsContext = createContext<Params>({}); // 用于传递参数
TableSelectorParamsContext.displayName = 'TableSelectorParamsContext';

type TableSelectorProviderProps = {
  params: Record<string, any>;
  resource: any;
  collection?: string;
  dragSort?: boolean;
  children?: any;
};

const useTableSelectorParams = () => {
  return useContext(TableSelectorParamsContext);
};

export const TableSelectorParamsProvider = ({ params, children }: { params: Params; children: any }) => {
  const parentParams = useTableSelectorParams();
  try {
    params.filter = mergeFilter([parentParams.filter, params.filter]);
    params = { ...parentParams, ...params };
  } catch (err) {
    console.error(err);
  }
  return <TableSelectorParamsContext.Provider value={params}>{children}</TableSelectorParamsContext.Provider>;
};

const InternalTableSelectorProvider = (props) => {
  const { params, rowKey, extraFilter } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [expandFlag, setExpandFlag] = useState(false);
  const parentRecordData = useCollectionParentRecordData();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <RecordProvider record={{}} parent={parentRecordData}>
      <TableSelectorContext.Provider
        value={{
          field,
          service,
          resource,
          params,
          extraFilter,
          rowKey,
          expandFlag,
          setExpandFlag: () => {
            setExpandFlag(!expandFlag);
          },
        }}
      >
        <RenderChildrenWithAssociationFilter {...props} />
      </TableSelectorContext.Provider>
    </RecordProvider>
  );
};

const useAssociationNames2 = (collection) => {
  const { getCollectionFields } = useCollectionManager_deprecated();
  const names = getCollectionFields(collection)
    ?.filter((field) => field.target)
    .map((field) => field.name);
  return names;
};

export const recursiveParent = (schema: Schema, component) => {
  return schema['x-component'] === component
    ? schema
    : schema.parent
      ? recursiveParent(schema.parent, component)
      : null;
};

const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager_deprecated();
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

export const TableSelectorProvider = withDynamicSchemaProps((props: TableSelectorProviderProps) => {
  const parentParams = useTableSelectorParams();
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField, getCollectionFields } = useCollectionManager_deprecated();
  const record = useRecord();
  const { getCollection } = useCollectionManager_deprecated();
  const { treeTable } = fieldSchema?.['x-decorator-props'] || {};
  const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
  const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);
  const collection = getCollection(collectionField?.collectionName);
  const primaryKey = collection?.getPrimaryKey();
  const appends = useAssociationNames(props.collection);
  let params = { ...props.params };
  if (props.dragSort) {
    params['sort'] = ['sort'];
  }
  if (collectionField?.target === collectionField?.collectionName && collection?.tree && treeTable !== false) {
    params['tree'] = true;
    if (collectionFieldSchema.name === 'parent') {
      params.filter = {
        ...(params.filter ?? {}),
        id: record[primaryKey] && {
          $ne: record[primaryKey],
        },
      };
    }
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  let extraFilter;
  if (collectionField) {
    if (['oho', 'o2m'].includes(collectionField.interface) && !isInFilterFormBlock(fieldSchema)) {
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
    if (['obo'].includes(collectionField.interface) && !isInFilterFormBlock(fieldSchema)) {
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

  try {
    params.filter = mergeFilter([parentParams.filter, params.filter]);
    params = { ...parentParams, ...params };
  } catch (err) {
    console.error(err);
  }

  const { filter: parsedFilter } = useParsedFilter({
    filterOption: params?.filter,
  });

  if (!_.isEmpty(params?.filter) && _.isEmpty(parsedFilter)) {
    return null;
  }

  if (params?.filter) {
    params.filter = parsedFilter;
  }

  return (
    <SchemaComponentOptions scope={{ treeTable }}>
      <BlockProvider name="table-selector" {...props} params={params}>
        <InternalTableSelectorProvider {...props} params={params} extraFilter={extraFilter} />
      </BlockProvider>
    </SchemaComponentOptions>
  );
});

export const useTableSelectorContext = () => {
  return useContext(TableSelectorContext);
};

export const useTableSelectorProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTableSelectorContext();
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
  const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);
  useEffect(() => {
    if (!ctx?.service?.loading) {
      const data = ctx?.service?.data?.data.map((v) => {
        return _.omit(v, collectionField?.foreignKey);
      });
      field.value = data;
      field?.setInitialValue?.(data);
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = ctx?.service?.data?.meta?.pageSize;
      field.componentProps.pagination.total = ctx?.service?.data?.meta?.count;
      field.componentProps.pagination.current = ctx?.service?.data?.meta?.page;
    }
  }, [
    collectionField?.foreignKey,
    ctx?.field?.data?.selectedRowKeys,
    ctx?.service?.data?.data,
    ctx?.service?.data?.meta?.count,
    ctx?.service?.data?.meta?.page,
    ctx?.service?.data?.meta?.pageSize,
    ctx?.service?.loading,
    field,
  ]);
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
