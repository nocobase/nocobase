import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../collection-manager';
import { useCompile } from '../../schema-component';
import { SchemaInitializer } from '../SchemaInitializer';
import {
  itemsMerge,
  useAssociatedTableColumnInitializerFields,
  useInheritsTableColumnInitializerFields,
  useTableColumnInitializerFields,
} from '../utils';

// 表格列配置
export const TableColumnInitializers = (props: any) => {
  const { action = true } = props;
  const { name } = useCollection();
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const associatedFields = useAssociatedTableColumnInitializerFields();
  const inheritFields = useInheritsTableColumnInitializerFields();
  const compile = useCompile();
  const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useTableColumnInitializerFields(),
    },
  ];
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
      Object.values(inherit)[0].length &&
        fieldItems.push(
          {
            type: 'divider',
          },
          {
            type: 'itemGroup',
            title: t(`Parent collection fields`) + '(' + compile(`${Object.keys(inherit)[0]}`) + ')',
            children: Object.values(inherit)[0].filter((v) => !v?.field?.isForeignKey),
          },
        );
    });
  }
  if (associatedFields?.length > 0 && (!isSubTable || field.readPretty)) {
    fieldItems.push(
      {
        type: 'divider',
      },
      {
        type: 'itemGroup',
        title: t('Display association fields'),
        children: associatedFields,
      },
    );
  }
  if (action) {
    fieldItems.push(
      {
        type: 'divider',
      },
      {
        type: 'item',
        title: t('Action column'),
        component: 'TableActionColumnInitializer',
      },
    );
  }

  return (
    <SchemaInitializer.Button
      data-testid={`configure-columns-button-of-table-block`}
      insertPosition={'beforeEnd'}
      icon={'SettingOutlined'}
      wrap={(s) => {
        if (s['x-action-column']) {
          return s;
        }
        return {
          type: 'void',
          'x-decorator': 'TableV2.Column.Decorator',
          'x-designer': 'TableV2.Column.Designer',
          'x-component': 'TableV2.Column',
          properties: {
            [s.name]: {
              ...s,
            },
          },
        };
      }}
      items={itemsMerge(fieldItems)}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
};
