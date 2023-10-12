import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { createFormBlockSchema } from '../utils';
import { DataBlockInitializer } from './DataBlockInitializer';
import { DataBlockInitializerV2 } from '../../application';

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

export const FormBlockInitializerV2 = (props) => {
  const { isCusomeizeCreate } = props;
  return (
    <DataBlockInitializerV2
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
