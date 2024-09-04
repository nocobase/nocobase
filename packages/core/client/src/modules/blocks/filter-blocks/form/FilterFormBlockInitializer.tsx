/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { Collection, CollectionFieldOptions } from '../../../../data-source';
import { FilterBlockInitializer } from '../../../../schema-initializer/items/FilterBlockInitializer';
import { useBlockTemplateContext } from '../../../../schema-templates/BlockTemplateProvider';
import { createFilterFormBlockSchema } from './createFilterFormBlockSchema';

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
  const { componentNamePrefix } = useBlockTemplateContext();

  return (
    <FilterBlockInitializer
      {...itemConfig}
      icon={<FormOutlined />}
      onlyCurrentDataSource={onlyCurrentDataSource}
      componentType={`${componentNamePrefix}FilterFormItem`}
      templateWrap={(templateSchema, { item }) => {
        const s = createFilterFormBlockSchema({
          templateSchema: templateSchema,
          dataSource: item.dataSource,
          collectionName: item.name || item.collectionName,
        });
        if (item.template && item.mode === 'reference') {
          s['x-template-key'] = item.template.key;
        }
        return s;
      }}
      onCreateBlockSchema={({ item }) => {
        return insert(
          createFilterFormBlockSchema({
            collectionName: item.collectionName || item.name,
            dataSource: item.dataSource,
          }),
        );
      }}
      filter={filterCollections}
      hideChildrenIfSingleCollection={hideChildrenIfSingleCollection}
    />
  );
};
