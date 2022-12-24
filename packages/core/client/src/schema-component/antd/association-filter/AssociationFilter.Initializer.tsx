import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../collection-manager';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../../../schema-initializer';

export const AssociationFilterInitializer = () => {
  const { t } = useTranslation();
  const { fields } = useCollection();

  const associatedFields = fields.filter((field) =>
    ['o2o', 'oho', 'obo', 'm2o', 'createdBy', 'updatedBy', 'o2m', 'm2m'].includes(field.interface),
  );

  const items: SchemaInitializerItemOptions[] = associatedFields.map((field) => ({
    type: 'item',
    key: field.key,
    title: field.uiSchema.title,
    component: 'AssociationFilterDesignerDisplayField',
    schema: {
      name: field.name,
      type: 'void',
      'x-designer': 'AssociationFilter.Item.Designer',
      'x-component': 'AssociationFilter.Item',
      'x-component-props': {
        fieldNames: {
          label: field.targetKey || 'id',
        },
      },
      properties: {},
    },
  }));

  const associatedFieldGroup: SchemaInitializerItemOptions = {
    type: 'itemGroup',
    title: t('Association fields'),
    children: items,
  };

  const dividerItem: SchemaInitializerItemOptions = {
    type: 'divider',
  };

  const deleteItem: SchemaInitializerItemOptions = {
    type: 'item',
    title: t('Delete'),
    component: 'AssociationFilterDesignerDelete',
  };

  return (
    <SchemaInitializer.Button
      className={css`
        margin-top: 16px;
      `}
      icon={'SettingOutlined'}
      title={t('Configure fields')}
      items={[associatedFieldGroup, dividerItem, deleteItem]}
    />
  );
};
