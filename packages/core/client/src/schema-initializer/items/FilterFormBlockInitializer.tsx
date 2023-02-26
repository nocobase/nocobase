import React from 'react';
import { FormOutlined } from '@ant-design/icons';
import { createFilterFormBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';

export const FilterFormBlockInitializer = (props) => {
  return (
    <FilterBlockInitializer
      {...props}
      icon={<FormOutlined />}
      componentType={'FormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          template: templateSchema,
          collection: item.name,
        });
        if (item.template && item.mode === 'reference') {
          s['x-template-key'] = item.template.key;
        }
        return s;
      }}
      createBlockSchema={createFilterFormBlockSchema}
    />
  );
};
