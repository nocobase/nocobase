import React, { FC } from 'react';

import { InheritanceCollectionMixin } from '../../../collection-manager';
import { AssociationCollectionFieldsProps, getInitializerItemsByFields } from '../utils';
import {
  SchemaInitializerChildren,
  SchemaInitializerItemGroup,
  SchemaInitializerItemType,
} from '../../../application/schema-initializer';

export const AssociationCollectionFields: FC<AssociationCollectionFieldsProps> = (props) => {
  const { filterAssociationField, filterSelfField = () => true, getSchema, ...otherProps } = props;
  const { collection, t, collectionManager } = props.context;
  const fields = collection.getFields();
  const associationInterfaces = ['o2o', 'oho', 'obo', 'm2o']; // 关联字段类型
  const associationFields = fields
    .filter((field) => {
      return associationInterfaces.includes(field.interface);
    })
    .filter((field) => filterSelfField(field, props.context));

  if (!associationFields.length) return null;

  const children = associationFields
    .map((associationField) => {
      // 获取关联表
      const associationCollection = collectionManager.getCollection<InheritanceCollectionMixin>(
        associationField.target!,
      )!;
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
      };

      const getAssociationFieldSchema: AssociationCollectionFieldsProps['getSchema'] = (field, context) => {
        const schema = getSchema(field, context);
        return {
          ...(schema || {}),
          'x-read-pretty': true,
          name: `${associationField.name}.${field.name}`,
          'x-collection-field': `${collection.name}.${associationField.name}.${field.name}`,
        };
      };

      return {
        type: 'subMenu',
        name: associationField.uiSchema?.title,
        title: associationField.uiSchema?.title,
        children: getInitializerItemsByFields(
          {
            ...otherProps,
            filter: filterAssociationField,
            getSchema: getAssociationFieldSchema,
          },
          associationCollectionFields!,
          newContext,
        ),
      } as SchemaInitializerItemType;
    });

  if (!children.length) return null;

  return <SchemaInitializerItemGroup title={t('Display association fields')}>{children}</SchemaInitializerItemGroup>;
};
