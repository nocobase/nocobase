import React, { FC } from 'react';

import { CollectionFieldOptions } from '../../collection/Collection';
import { InheritanceCollectionMixin } from '../../../collection-manager';
import { ParentCollectionFieldsProps, getInitializerItemsByFields, useCollectionFieldContext } from '../utils';
import { SchemaInitializerChildren, SchemaInitializerItemType } from '../../../application/schema-initializer';

export const ParentCollectionFields: FC<ParentCollectionFieldsProps> = (props) => {
  const context = useCollectionFieldContext();
  const { collection, t, collectionManager } = context;

  const parentCollectionNames = collection.getParentCollectionsName();
  if (!parentCollectionNames.length) return null;

  const children = parentCollectionNames
    .map((parentCollectionName) => {
      // 获取父表的字段
      const parentCollectionFields = collection.getParentCollectionFields(parentCollectionName);
      // 如果没有父表字段，返回 null
      if (parentCollectionFields.length === 0) return null;
      // 获取父表
      const parentCollection = collectionManager.getCollection<InheritanceCollectionMixin>(parentCollectionName)!;
      return { parentCollection, parentCollectionFields };
    })
    // 过滤掉 null
    .filter(Boolean)
    // 修改数据结构
    .map((options) => {
      const { parentCollection, parentCollectionFields } = options as {
        parentCollection: InheritanceCollectionMixin;
        parentCollectionFields: CollectionFieldOptions[];
      };
      const newContext = {
        ...context,
        collection: parentCollection,
      };

      return {
        type: 'itemGroup',
        divider: true,
        title: t(`Parent collection fields`) + '(' + context.compile(parentCollection.title) + ')',
        children: getInitializerItemsByFields(props, parentCollectionFields, newContext),
      } as SchemaInitializerItemType;
    });

  return <SchemaInitializerChildren>{children}</SchemaInitializerChildren>;
};
