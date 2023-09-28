import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOptionalFieldList } from '../../../block-provider/hooks';
import { useAssociatedFields } from '../../../filter-provider/utils';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../../../schema-initializer';

export const AssociationFilterFilterBlockInitializer = () => {
  const { t } = useTranslation();
  const associatedFields = useAssociatedFields();
  const optionalList = useOptionalFieldList();
  const useProps = '{{useAssociationFilterBlockProps}}';
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
  const optionalChildren: SchemaInitializerItemOptions[] = optionalList.map((field) => ({
    type: 'item',
    key: field.key,
    title: field.uiSchema.title,
    component: 'AssociationFilterDesignerDisplayField',
    schema: {
      name: field.name,
      title: field.uiSchema.title,
      interface: field.interface,
      type: 'void',
      'x-designer': 'AssociationFilter.Item.Designer',
      'x-component': 'AssociationFilter.Item',
      'x-component-props': {
        fieldNames: {
          label: field.name,
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

  // 选项字段
  const optionalFieldGroup: SchemaInitializerItemOptions = {
    type: 'itemGroup',
    title: t('Choices fields'),
    children: optionalChildren,
  };

  const dividerItem: SchemaInitializerItemOptions = {
    type: 'divider',
  };

  const deleteItem: SchemaInitializerItemOptions = {
    type: 'item',
    title: t('Delete'),
    component: 'AssociationFilterDesignerDelete',
  };

  const items = [associatedFieldGroup, optionalFieldGroup];

  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-association-filter-filter-block"
      className={css`
        margin-top: 16px;
      `}
      icon={'SettingOutlined'}
      title={t('Configure fields')}
      items={items}
    />
  );
};
