import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { createFormBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';

export const FormBlockInitializer = (props) => {
  const { isCusomeizeCreate } = props;
  return (
    <DataBlockInitializer
      {...props}
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
