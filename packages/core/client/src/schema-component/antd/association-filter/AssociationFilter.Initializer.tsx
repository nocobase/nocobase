import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAssociatedFields } from '../../../filter-provider/utils';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../../../schema-initializer';

export const AssociationFilterInitializer = () => {
  const { t } = useTranslation();
  const associatedFields = useAssociatedFields();
  const useProps = '{{useAssociationFilterProps}}';
  const children: SchemaInitializerItemOptions[] = associatedFields.map((field) => ({
    type: 'item',
    key: field.key,
    title: field.uiSchema?.title,
    component: 'AssociationFilterDesignerDisplayField',
    schema: {
      name: field.name,
      title: field.uiSchema?.title,
      type: 'void',
      'x-designer': 'AssociationFilter.Item.Designer',
      'x-component': 'AssociationFilter.Item',
      'x-component-props': {
        fieldNames: {
          label: field.targetKey || 'id',
        },
        useProps,
      },
      properties: {},
    },
  }));

  const associatedFieldGroup: SchemaInitializerItemOptions = {
    type: 'itemGroup',
    title: t('Association fields'),
    children,
  };

  const dividerItem: SchemaInitializerItemOptions = {
    type: 'divider',
  };

  const deleteItem: SchemaInitializerItemOptions = {
    type: 'item',
    title: t('Delete'),
    component: 'AssociationFilterDesignerDelete',
  };

  const items = [associatedFieldGroup, dividerItem, deleteItem];

  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-association-filter"
      className={css`
        margin-top: 16px;
      `}
      icon={'SettingOutlined'}
      title={t('Configure fields')}
      items={items}
    />
  );
};
