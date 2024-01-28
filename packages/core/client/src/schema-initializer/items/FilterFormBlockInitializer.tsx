import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializerItem } from '../../application';
import { createFilterFormBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';

export const FilterFormBlockInitializer = ({ filterItems }) => {
  const itemConfig = useSchemaInitializerItem();

  return (
    <FilterBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      componentType={'FilterFormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          template: templateSchema,
          collection: item.collectionName,
          settings: 'blockSettings:filterForm',
        });
        if (item.template && item.mode === 'reference') {
          s['x-template-key'] = item.template.key;
        }
        return s;
      }}
      createBlockSchema={(options) => {
        options = { ...options, settings: 'blockSettings:filterForm' };
        return createFilterFormBlockSchema(options);
      }}
      filterItems={filterItems}
    />
  );
};
