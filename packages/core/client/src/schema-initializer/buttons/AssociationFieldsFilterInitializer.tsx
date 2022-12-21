import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, SchemaInitializerItemOptions } from '..';
import { CollectionFieldProvider, useCollection } from '../../collection-manager';

export const AssociationFieldsFilterInitializer = () => {
  const { t } = useTranslation();
  const { fields } = useCollection();

  const associatedFields = fields.filter((field) => ['o2o', 'oho', 'obo', 'm2o'].includes(field.interface));

  const items: SchemaInitializerItemOptions[] = associatedFields.map((field) => ({
    type: 'item',
    key: field.key,
    title: field.uiSchema.title,
    component: 'AssociationFieldsFilterActionInitializerItem',
    collectionFieldKey: field.key,
    schema: {
      type: 'void',
      'x-collection-fieldKey': field.key,
      'x-designer': 'AssociationFieldsFilterInnerItem.Designer',
      'x-designer-props': {
        target: field.target,
        fieldNames: {
          label: 'title',
        },
      },
      'x-decorator': 'CollectionFieldProvider',
      'x-decorator-props': {
        name: field.name,
      },
      'x-component': 'AssociationFieldsFilterInnerItem',
      'x-component-props': {
        target: field.target,
      },
      properties: {},
    },
  }));

  const associatedFieldGroup: SchemaInitializerItemOptions = {
    type: 'itemGroup',
    title: t('关联'),
    children: items,
  };

  const dividerItem: SchemaInitializerItemOptions = {
    type: 'divider',
  };

  const deleteItem: SchemaInitializerItemOptions = {
    type: 'item',
    title: t('Delete'),
    component: 'AssociationFieldsFilterInitializerDelete',
  };

  return (
    <SchemaInitializer.Button
      icon={'SettingOutlined'}
      title={t('Configure fields')}
      items={[associatedFieldGroup, dividerItem, deleteItem]}
    />
  );
};
