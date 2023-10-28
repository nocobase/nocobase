import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { createFilterFormBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';
import { useSchemaInitializerItem } from '../../application';

export const FilterFormBlockInitializer = (props) => {
  const itemConfig = useSchemaInitializerItem();
  const items = itemConfig?.key === 'filterFormBlockInTableSelector' && [];

  return (
    <FilterBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      componentType={'FilterFormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          template: templateSchema,
          collection: item.collectionName,
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
