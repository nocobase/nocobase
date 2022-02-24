import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { useTableColumnInitializerFields } from './utils';

// 表格列配置
export const TableColumnInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      wrap={(s) => {
        return {
          type: 'void',
          'x-decorator': 'Table.Column.Decorator',
          'x-designer': 'Table.Column.Deigner',
          'x-component': 'Table.Column',
          properties: {
            [s.name]: {
              'x-read-pretty': true,
              ...s,
            },
          },
        };
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: useTableColumnInitializerFields(),
        },
      ]}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
};
