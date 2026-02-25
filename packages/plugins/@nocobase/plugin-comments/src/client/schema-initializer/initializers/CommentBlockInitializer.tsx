/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { CommentOutlined } from '@ant-design/icons';
import {
  Collection,
  CollectionFieldOptions,
  DataBlockInitializer,
  useCollectionManager_deprecated,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React from 'react';
import { createCommentBlockUISchema } from '../createCommentBlockUISchema';

export const CommentBlockInitializer = ({
  filterCollections,
  filterOtherRecordsCollection,
  onlyCurrentDataSource,
  hideSearch,
  showAssociationFields,
  hideOtherRecordsInPopup,
}: {
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  filterOtherRecordsCollection: (collection?: Collection) => boolean;
  onlyCurrentDataSource: boolean;
  hideSearch?: boolean;
  showAssociationFields?: boolean;
  hideOtherRecordsInPopup?: boolean;
}) => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  const { getCollection } = useCollectionManager_deprecated();

  return (
    <DataBlockInitializer
      {...itemConfig}
      componentType="Comment"
      icon={<CommentOutlined />}
      onlyCurrentDataSource={onlyCurrentDataSource}
      hideSearch={hideSearch}
      filter={filterCollections}
      filterOtherRecordsCollection={filterOtherRecordsCollection}
      showAssociationFields={showAssociationFields}
      hideOtherRecordsInPopup={hideOtherRecordsInPopup}
      onCreateBlockSchema={async ({ item, fromOthersInPopup }) => {
        const collection = getCollection(item.name, item.dataSource);
        const field = item.associationField;
        if (field && !fromOthersInPopup) {
          insert(
            createCommentBlockUISchema({
              dataSource: item.dataSource,
              rowKey: collection.filterTargetKey || 'id',
              association: `${field.collectionName}.${field.name}`,
            }),
          );
        } else {
          insert(
            createCommentBlockUISchema({
              collectionName: item.name,
              dataSource: item.dataSource,
              rowKey: collection?.filterTargetKey || 'id',
            }),
          );
        }
      }}
      alwaysRenderMenu
    />
  );
};
