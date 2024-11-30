/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppstoreOutlined } from '@ant-design/icons';
import React from 'react';
import { useSchemaInitializer, useSchemaInitializerItem } from '../../../../application';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { Collection, CollectionFieldOptions } from '../../../../data-source/collection/Collection';
import { DataBlockInitializer } from '../../../../schema-initializer/items/DataBlockInitializer';
import { createGridCardBlockUISchema } from './createGridCardBlockUISchema';

export const GridCardBlockInitializer = ({
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
  const { createGridCardBlock } = useCreateGridCardBlock();

  return (
    <DataBlockInitializer
      {...itemConfig}
      icon={<AppstoreOutlined />}
      componentType={`GridCard`}
      onCreateBlockSchema={async (options) => {
        if (createBlockSchema) {
          return createBlockSchema(options);
        }
        createGridCardBlock(options);
      }}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      showAssociationFields={showAssociationFields}
    />
  );
};

export const useCreateGridCardBlock = () => {
  const { insert } = useSchemaInitializer();
  const { getCollection } = useCollectionManager_deprecated();

  const createGridCardBlock = ({ item }) => {
    const collection = getCollection(item.name, item.dataSource);
    const schema = createGridCardBlockUISchema({
      collectionName: item.name,
      dataSource: item.dataSource,
      rowKey: collection.filterTargetKey || 'id',
    });
    insert(schema);
  };

  return { createGridCardBlock };
};
