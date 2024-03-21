import { observer, useForm } from '@formily/react';
import { cloneDeep } from 'lodash';
import React, { createContext, useContext, useState } from 'react';
import {
  CollectionOptions,
  CollectionProvider_deprecated,
  useActionContext,
  useCollectionManager_deprecated,
  useRecord,
  useRecordIndex,
  useRequest,
} from '../';
import { useAPIClient } from '../api-client';

const collection: CollectionOptions = {
  name: 'fields',
  targetKey: 'name',
  fields: [
    {
      type: 'string',
      name: 'type',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Storage type") }}',
        type: 'string',
        'x-component': 'Select',
        enum: [
          {
            label: 'String',
            value: 'string',
          },
        ],
        required: true,
      },
    },
    {
      type: 'string',
      name: 'interface',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field interface") }}',
        type: 'string',
        'x-component': 'Select',
        enum: '{{interfaces}}',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field display name") }}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field name") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
  ],
};

export const DataSourceContext_deprecated = createContext(null);
DataSourceContext_deprecated.displayName = 'DataSourceContext_deprecated';

const useSelectedRowKeys = () => {
  const ctx = useContext(DataSourceContext_deprecated);
  return [ctx.selectedRowKeys, ctx.setSelectedRowKeys];
};

const useDataSource_deprecated = (options) => {
  const ctx = useContext(DataSourceContext_deprecated);
  return useRequest(
    () => {
      return Promise.resolve({
        data: ctx.dataSource,
      });
    },
    {
      ...options,
      refreshDeps: [JSON.stringify(ctx.dataSource)],
    },
  );
};

const useCreateAction = () => {
  const ctx = useContext(DataSourceContext_deprecated);
  const form = useForm();
  const { setVisible } = useActionContext();
  return {
    async run() {
      console.log('form.values', form.values);
      const dataSource = ctx.dataSource || [];
      dataSource.push(cloneDeep(form.values));
      ctx.setDataSource([...dataSource]);
      setVisible(false);
      await form.reset();
    },
  };
};

const useBulkDestroyAction = () => {
  const ctx = useContext(DataSourceContext_deprecated);
  const { selectedRowKeys, setSelectedRowKeys } = ctx;
  return {
    async run() {
      const dataSource: any[] = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((_, index) => {
          return !selectedRowKeys.includes(index);
        }),
      );
      setSelectedRowKeys([]);
    },
  };
};

const useUpdateAction = () => {
  const recordIndex = useRecordIndex();
  const form = useForm();
  const { setVisible } = useActionContext();
  const ctx = useContext(DataSourceContext_deprecated);
  return {
    async run() {
      const dataSource: any[] = ctx?.dataSource || [];
      const values = dataSource.map((item, index) => {
        if (index === recordIndex) {
          return { ...form.values };
        }
        return item;
      });
      ctx.setDataSource([...values]);
      setVisible(false);
    },
  };
};

const useDestroyAction = () => {
  const recordIndex = useRecordIndex();
  const ctx = useContext(DataSourceContext_deprecated);
  return {
    async run() {
      const dataSource: any[] = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((_, index) => {
          return recordIndex !== index;
        }),
      );
    },
  };
};

export const ds = {
  useSelectedRowKeys,
  useDataSource_deprecated,
  useCreateAction,
  useBulkDestroyAction,
  useUpdateAction,
  useDestroyAction,
};

export const SubFieldDataSourceProvider_deprecated = observer(
  (props) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const record = useRecord();
    const api = useAPIClient();
    const service = useRequest(
      () => {
        if (record.interface === 'subTable') {
          if (record?.children?.length) {
            return Promise.resolve({
              data: record?.children || [],
            });
          }
          return api
            .resource('fields')
            .list({
              paginate: false,
              // appends: ['uiSchema'],
              sort: 'sort',
              filter: {
                parentKey: record.key,
              },
            })
            .then((res) => res?.data);
        }
        return Promise.resolve({
          data: [],
        });
      },
      {
        onSuccess(data) {
          console.log('dataSource1', data?.data);
          setDataSource(data?.data);
        },
      },
    );
    return (
      <CollectionProvider_deprecated collection={collection}>
        <DataSourceContext_deprecated.Provider
          value={{
            rowKey: 'name',
            service,
            dataSource,
            setDataSource,
            selectedRowKeys,
            setSelectedRowKeys,
          }}
        >
          {props.children}
        </DataSourceContext_deprecated.Provider>
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'SubFieldDataSourceProvider_deprecated' },
);

export const DataSourceProvider_deprecated = observer(
  (props: any) => {
    const { rowKey, collection, association } = props;
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const record = useRecord();
    const api = useAPIClient();
    const { getCollection } = useCollectionManager_deprecated();
    const coll = getCollection(collection);
    const resourceOf = record?.[association.targetKey || 'id'];
    const service = useRequest(
      () => {
        if (resourceOf) {
          return api
            .request({
              resource: `${association.collectionName}.${association.name}`,
              resourceOf,
              action: 'list',
              params: {
                appends: coll?.fields?.filter((field) => field.target)?.map((field) => field.name),
              },
            })
            .then((res) => res.data);
        }
        return Promise.resolve({
          data: record?.[association.name] || [],
        });
      },
      {
        onSuccess(data) {
          setDataSource(data?.data);
        },
      },
    );
    return (
      <CollectionProvider_deprecated collection={coll}>
        <DataSourceContext_deprecated.Provider
          value={{
            rowKey,
            service,
            dataSource,
            setDataSource,
            selectedRowKeys,
            setSelectedRowKeys,
          }}
        >
          {props.children}
        </DataSourceContext_deprecated.Provider>
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'DataSourceProvider_deprecated' },
);
