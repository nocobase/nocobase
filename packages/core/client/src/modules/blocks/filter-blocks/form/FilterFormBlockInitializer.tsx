import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializerItem } from '../../../../application';
import { createFilterFormBlockSchema } from '../../../../schema-initializer/utils';
import { FilterBlockInitializer } from '../../../../schema-initializer/items/FilterBlockInitializer';
import { Collection } from '../../../../data-source';

export const FilterFormBlockInitializer = ({
  filterMenuItemChildren,
  onlyCurrentDataSource,
}: {
  filterMenuItemChildren: (collection: Collection) => boolean;
  onlyCurrentDataSource: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();

  return (
    <FilterBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      onlyCurrentDataSource={onlyCurrentDataSource}
      componentType={'FilterFormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          template: templateSchema,
          dataSource: item.dataSource,
          collection: item.name || item.collectionName,
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
      filter={filterMenuItemChildren}
    />
  );
};
