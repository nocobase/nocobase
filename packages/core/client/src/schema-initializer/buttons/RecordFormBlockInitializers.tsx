import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from '../utils';

export const RecordFormBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      data-testid="grid-schema-initializer-RecordFormBlockInitializers"
      wrap={gridRowColWrap}
      title={t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: '{{ t("Data blocks") }}',
          children: [
            {
              type: 'item',
              title: '{{ t("Form") }}',
              component: 'RecordFormBlockInitializer',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: '{{t("Other blocks")}}',
          children: [
            {
              type: 'item',
              title: '{{t("Markdown")}}',
              component: 'MarkdownBlockInitializer',
            },
          ],
        },
      ]}
    />
  );
};
