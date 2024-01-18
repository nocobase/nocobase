import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializerItem } from '../../application';
import { createFormBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

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
          settings: 'blockSettings:creationForm',
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
