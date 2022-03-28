import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from '../utils';

export const CreateFormBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={t('Add block')}
      items={[
        {
          type: 'itemGroup',
          title: '{{ t("Data blocks") }}',
          children: [
            {
              type: 'item',
              title: '{{ t("Form") }}',
              component: 'CreateFormBlockInitializer',
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
