import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializerItem } from '../../application';
import { createFilterFormBlockSchema } from '../utils';
import { FilterBlockInitializer } from './FilterBlockInitializer';

export const FilterFormBlockInitializer = () => {
  const itemConfig = useSchemaInitializerItem();

  return (
    <FilterBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      componentType={'FilterFormItem'}
      isItem={itemConfig?.name === 'filterFormBlockInTableSelector'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          template: templateSchema,
          dataSource: item.dataSource,
          collection: item.collectionName,
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
