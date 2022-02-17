import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { FormBlock } from './FormBlock';
import { TableBlock } from './TableBlock';

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

export const BlockInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: t('Data blocks'),
          children: [
            {
              type: 'item',
              title: t('Table'),
              component: TableBlock,
            },
            {
              type: 'item',
              title: t('Form'),
              component: FormBlock,
            },
          ],
        },
      ]}
    >
      {t('Add block')}
    </SchemaInitializer.Button>
  );
});
