import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, SchemaInitializerV2 } from '../..';
import { gridRowColWrap } from '../utils';

export const RecordFormBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      data-testid="add-block-button-in-record-form-block"
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

export const recordFormBlockInitializers = new SchemaInitializerV2({
  name: 'RecordFormBlockInitializers',
  'data-testid': 'add-block-button-in-record-form-block',
  title: '{{ t("Add block") }}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      type: 'itemGroup',
      title: '{{ t("Data blocks") }}',
      name: 'data-blocks',
      children: [
        {
          name: 'form',
          title: '{{ t("Form") }}',
          Component: 'RecordFormBlockInitializer',
        },
      ],
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'other-blocks',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});
