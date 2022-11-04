import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useContext, useEffect, useState } from 'react';
import { useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { SchemaComponent, SchemaComponentContext, useActionContext, useCompile } from '../../schema-component';
import { useCollectionManager } from '../hooks/useCollectionManager';
import { DataSourceContext } from '../sub-table';
import { AddSubFieldAction } from './AddSubFieldAction';
import { FieldSummary } from './components/FieldSummary';
import { EditSubFieldAction } from './EditSubFieldAction';
import { collectionSchema } from './schemas/collections';
import { CollectionFieldsTable } from ".";

const useAsyncDataSource = (service: any) => (field: any) => {
  field.loading = true;
  service(field).then(
    action.bound((data: any) => {
      field.dataSource = data;
      field.loading = false;
    }),
  );
};

const useCollectionValues = (options) => {
  const { visible } = useActionContext();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          name: `t_${uid()}`,
          createdBy: true,
          updatedBy: true,
          sortable: true,
          logging: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
            {
              interface: 'createdAt',
              type: 'date',
              field: 'createdAt',
              name: 'createdAt',
              uiSchema: {
                type: 'datetime',
                title: '{{t("Created at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              interface: 'createdBy',
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'createdById',
              name: 'createdBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Created by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
            {
              type: 'date',
              field: 'updatedAt',
              name: 'updatedAt',
              interface: 'updatedAt',
              uiSchema: {
                type: 'string',
                title: '{{t("Last updated at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'updatedById',
              name: 'updatedBy',
              interface: 'updatedBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Last updated by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
          ],
        },
      }),
    {
      ...options,
      manual: true,
    },
  );

  useEffect(() => {
    if (visible) {
      result.run();
    }
  }, [visible]);

  return result;
};

const useSelectedRowKeys = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  return [selectedRowKeys, setSelectedRowKeys];
};

const useDestroySubField = () => {
  const record = useRecord();
  const form = useForm();
  return {
    async run() {
      const children = form.values?.children?.slice?.();
      form.setValuesIn(
        'children',
        children.filter((child) => {
          return child.name !== record.name;
        }),
      );
    },
  };
};

const useBulkDestroySubField = () => {
  return {
    async run() {},
  };
};

// 获取当前字段列表
const useCurrentFields = () => {
  const record = useRecord();
  // 仅当当前字段为子表单时，从DataSourceContext中获取已配置的字段列表
  if (record.__parent && record.__parent.interface === 'subTable') {
    const ctx = useContext(DataSourceContext);
    return ctx.dataSource;
  }

  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(record.collectionName || record.name) as any[];
  return fields;
};

const useNewId = (prefix) => {
  return `${prefix || ''}${uid()}`;
};

export const ConfigurationTable = () => {
  const { collections = [] } = useCollectionManager();
  const compile = useCompile();
  const loadCollections = async (field: any) => {
    return collections
      ?.filter((item) => !(item.autoCreate && item.isThrough))
      .map((item: any) => ({
        label: compile(item.title),
        value: item.name,
      }));
  };
  const ctx = useContext(SchemaComponentContext);
  return (
    <div>
      <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
        <SchemaComponent
          schema={collectionSchema}
          components={{
            AddSubFieldAction,
            EditSubFieldAction,
            FieldSummary,
            CollectionFieldsTable
          }}
          scope={{
            useDestroySubField,
            useBulkDestroySubField,
            useSelectedRowKeys,
            useCollectionValues,
            useAsyncDataSource,
            loadCollections,
            useCurrentFields,
            useNewId,
          }}
        />
      </SchemaComponentContext.Provider>
    </div>
  );
};
