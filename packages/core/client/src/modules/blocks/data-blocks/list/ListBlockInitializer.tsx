/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OrderedListOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { createListBlockUISchema } from './createListBlockUISchema';

export const ListBlockInitializer = ({
  filterCollections,
  onlyCurrentDataSource,
  hideSearch,
  createBlockSchema,
  componentType = 'FormItem',
  templateWrap,
  showAssociationFields,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  createBlockSchema?: (options: any) => any;
  /**
   * 虽然这里的命名现在看起来比较奇怪，但为了兼容旧版本的 template，暂时保留这个命名。
   */
  componentType?: 'FormItem';
  templateWrap?: (
    templateSchema: any,
    {
      item,
    }: {
      item: any;
    },
  ) => any;
  showAssociationFields?: boolean;
}) => {
  const itemConfig = useSchemaInitializerItem();
  const { createListBlock } = useCreateListBlock();

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<OrderedListOutlined />}
      componentType={`List`}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }
        createListBlock(options);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};

export const useCreateListBlock = () => {
  const { getCollection } = useCollectionManager_deprecated();
  const { insert } = useSchemaInitializer();

  const createListBlock = ({ item }) => {
    const collection = getCollection(item.name, item.dataSource);
    const schema = createListBlockUISchema({
      collectionName: item.name,
      dataSource: item.dataSource,
      rowKey: collection.filterTargetKey || 'id',
    });
    insert(schema);
  };

  return { createListBlock };
};
