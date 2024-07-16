import React, { FC } from "react";

import { InheritanceCollectionMixin } from "../../../collection-manager";
import { CollectionFieldsItemProps, getInitializerItemsByFields } from "../utils";
import { SchemaInitializerItemGroup, SchemaInitializerItemType } from "../../../application/schema-initializer";

export const AssociationFields: FC<CollectionFieldsItemProps> = (props) => {
  const { collection, t, collectionManager } = props.context;
  const fields = collection.getFields();
  const associationInterfaces = ['o2o', 'oho', 'obo', 'm2o'];
  const associationFields = fields
    .filter(field => {
      return associationInterfaces.includes(field.interface);
    });

  if (!associationFields.length) return null;

  const children = associationFields
    .map((associationField) => {
      // 获取关联表
      const associationCollection = collectionManager.getCollection<InheritanceCollectionMixin>(associationField.target!)!;
      if (!associationCollection) return null;
      // 获取父表
      const associationCollectionFields = associationCollection?.getAllFields();
      if (!associationCollectionFields.length) return null;
      return { associationField, associationCollection, associationCollectionFields };
    })
    .filter(Boolean)
    // 修改数据结构
    .map(({ associationField, associationCollection, associationCollectionFields }: any) => {
      const newContext = {
        ...props.context,
        collection: associationCollection,
      }

      return {
        type: 'subMenu',
        name: associationField.uiSchema?.title,
        title: associationField.uiSchema?.title,
        children: getInitializerItemsByFields(props, associationCollectionFields!, newContext),
      } as SchemaInitializerItemType;
    })

  if (!children.length) return null;

  return <SchemaInitializerItemGroup title={t('Display association fields')} children={children} />
}
