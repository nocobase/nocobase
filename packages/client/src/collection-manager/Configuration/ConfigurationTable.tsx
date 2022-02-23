import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useEffect } from 'react';
import { useRequest } from '../../api-client';
import { SchemaComponent, useActionContext } from '../../schema-component';
import { useCollectionManager } from '../hooks/useCollectionManager';
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
      <SchemaComponent schema={collectionSchema} scope={{ useCollectionValues, useAsyncDataSource, loadCollections }} />
    </div>
  );
};
