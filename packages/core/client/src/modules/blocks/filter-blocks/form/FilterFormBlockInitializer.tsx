import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { createFilterFormBlockSchema } from '../../../../schema-initializer/utils';
import { FilterBlockInitializer } from '../../../../schema-initializer/items/FilterBlockInitializer';
import { Collection, CollectionFieldOptions } from '../../../../data-source';

export const FilterFormBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideChildrenIfSingleCollection,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideChildrenIfSingleCollection?: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();

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
      onCreateBlockSchema={({ item }) => {
        return insert(
          createFilterFormBlockSchema({
            collection: item.collectionName || item.name,
            dataSource: item.dataSource,
            settings: 'blockSettings:filterForm',
          }),
        );
      }}
      filter={filterCollections}
      hideChildrenIfSingleCollection={hideChildrenIfSingleCollection}
    />
  );
};
