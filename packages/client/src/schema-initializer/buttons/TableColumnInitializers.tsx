import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../SchemaInitializer';
import { itemsMerge, useTableColumnInitializerFields } from '../utils';

// 表格列配置
export const TableColumnInitializers = (props: any) => {
  const { items = [] } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
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
      items={itemsMerge(
        [
          {
            type: 'itemGroup',
            title: t('Display fields'),
            children: useTableColumnInitializerFields(),
          },
          {
            type: 'divider',
          },
          {
            type: 'item',
            title: t('Action column'),
            component: 'TableActionColumnInitializer',
          },
        ],
        items,
      )}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
};
