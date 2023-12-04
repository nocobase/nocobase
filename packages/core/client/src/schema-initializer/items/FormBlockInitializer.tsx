import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { createFormBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { useSchemaInitializerItem } from '../../application';

export const FormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { isCusomeizeCreate } = itemConfig;
  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      componentType={'FormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFormBlockSchema({
          isCusomeizeCreate,
          template: templateSchema,
          collection: item.name,
        });
        if (item.template && item.mode === 'reference') {
          s['x-template-key'] = item.template.key;
        }
        return s;
      }}
      createBlockSchema={createFormBlockSchema}
    />
  );
};
