import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { createFormBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const FormBlockInitializer = (props) => {
  return (
    <DataBlockInitializer
      {...props}
      icon={<FormOutlined />}
      componentType={'FormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFormBlockSchema({
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
