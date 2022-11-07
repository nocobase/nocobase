import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import {
  itemsMerge,
  useAssociatedTableColumnInitializerFields,
  useTableColumnInitializerFields,
  useInheritsTableColumnInitializerFields,
} from '../utils';

// 表格列配置
export const TableColumnInitializers = (props: any) => {
  const { items = [] } = props;
  const { t } = useTranslation();
  const associatedFields = useAssociatedTableColumnInitializerFields();
  const inheritFields = useInheritsTableColumnInitializerFields();
  const fieldItems: any[] = [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      children: useTableColumnInitializerFields(),
    },
  ];
  if (inheritFields?.length > 0) {
    inheritFields.forEach((inherit) => {
      fieldItems.push(
        {
          type: 'divider',
        },
        {
          type: 'itemGroup',
          title: t(`Parent collection fields(${Object.keys(inherit)[0]})`),
          children: Object.values(inherit)[0],
        },
      );
    });
  }
  if (associatedFields?.length > 0) {
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
  return (
    <SchemaInitializer.Button
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
      items={itemsMerge(fieldItems, items)}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
};
