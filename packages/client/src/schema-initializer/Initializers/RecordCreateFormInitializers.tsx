import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from './utils';

export const RecordCreateFormInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={t('Add block')}
      items={[
        {
          type: 'itemGroup',
          title: 'Form',
          children: [
            {
              type: 'item',
              title: 'Blank',
              component: 'RecordFormBlockInitializer',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: 'Media',
          children: [
            {
              type: 'item',
              title: 'Markdown',
              component: 'MarkdownBlockInitializer',
            },
          ],
        },
      ]}
    />
  );
};
