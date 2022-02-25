import { observer, useForm } from '@formily/react';
import { cloneDeep } from 'lodash';
import React, { createContext, useContext, useState } from 'react';
import { CollectionOptions, CollectionProvider, useActionContext, useRecord, useRequest } from '../';
import { useAPIClient } from '../api-client';
import { options } from './Configuration/interfaces';

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
        enum: options as any,
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

export const DataSourceContext = createContext(null);

const useSelectedRowKeys = () => {
  const ctx = useContext(DataSourceContext);
  return [ctx.selectedRowKeys, ctx.setSelectedRowKeys];
};

const useDataSource = (options) => {
  const ctx = useContext(DataSourceContext);
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
  const ctx = useContext(DataSourceContext);
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
  const ctx = useContext(DataSourceContext);
  const { selectedRowKeys, setSelectedRowKeys } = ctx;
  return {
    async run() {
      const dataSource = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((item) => {
          return !selectedRowKeys.includes(item[ctx.rowKey]);
        }),
      );
      setSelectedRowKeys([]);
    },
  };
};

const useUpdateAction = () => {
  const record = useRecord();
  const form = useForm();
  const { setVisible } = useActionContext();
  const ctx = useContext(DataSourceContext);
  return {
    async run() {
      const dataSource = ctx?.dataSource || [];
      const rowKey = ctx?.rowKey;
      const values = dataSource.map((item) => {
        if (record[rowKey] === item[rowKey]) {
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
  const record = useRecord();
  const ctx = useContext(DataSourceContext);
  return {
    async run() {
      const rowKey = ctx.rowKey;
      const dataSource = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((item) => {
          return record[rowKey] !== item[rowKey];
        }),
      );
    },
  };
};

export const ds = {
  useSelectedRowKeys,
  useDataSource,
  useCreateAction,
  useBulkDestroyAction,
  useUpdateAction,
  useDestroyAction,
};

export const SubFieldDataSourceProvider = observer((props) => {
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
            appends: ['uiSchema'],
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
    <CollectionProvider collection={collection}>
      <DataSourceContext.Provider
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
      </DataSourceContext.Provider>
    </CollectionProvider>
  );
});

export const DataSourceProvider = observer((props: any) => {
  const { rowKey = 'id', collection, association } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const record = useRecord();
  const api = useAPIClient();
  const resourceOf = record?.[association.targetKey || 'id'];
  console.log('record', record);
  const service = useRequest(
    () => {
      if (resourceOf) {
        return api
          .request({
            resource: `${collection}.${association.name}`,
            resourceOf,
            action: 'list',
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
    <CollectionProvider name={collection}>
      <DataSourceContext.Provider
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
      </DataSourceContext.Provider>
    </CollectionProvider>
  );
});
