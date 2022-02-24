import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useEffect, useState } from 'react';
import { useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { SchemaComponent, useActionContext } from '../../schema-component';
import { useCollectionManager } from '../hooks/useCollectionManager';
import { AddSubFieldAction } from './AddSubFieldAction';
import { EditSubFieldAction } from './EditSubFieldAction';
import { collectionSchema } from './schemas/collections';

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

export const ConfigurationTable = () => {
  const { collections = [] } = useCollectionManager();
  const loadCollections = async (field: any) => {
    return collections?.map((item: any) => ({
      label: item.title,
      value: item.name,
    }));
  };
  return (
    <div>
      <SchemaComponent
        schema={collectionSchema}
        components={{
          AddSubFieldAction,
          EditSubFieldAction,
        }}
        scope={{
          useDestroySubField,
          useBulkDestroySubField,
          useSelectedRowKeys,
          useCollectionValues,
          useAsyncDataSource,
          loadCollections,
        }}
      />
    </div>
  );
};
