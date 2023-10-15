import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { createFilterFormBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';

export const FilterFormBlockInitializer = (props) => {
  const { item } = props;
  const items = item?.key === 'filterFormBlockInTableSelector' && [];

  return (
    <FilterBlockInitializer
      {...props}
      icon={<FormOutlined />}
      componentType={'FilterFormItem'}
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
      items={items}
    />
  );
};
