import { SchemaInitializer, SchemaInitializerV2, gridRowColWrap } from '@nocobase/client';
import React from 'react';
import { useSnapshotTranslation } from '../../locale';

export const SnapshotBlockInitializers = (props: any) => {
  const { t } = useSnapshotTranslation();
  const { insertPosition, component } = props;
  return (
    <SchemaInitializer.Button
      data-testid="add-block-button-in-snapshot-block"
      wrap={gridRowColWrap}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: '{{t("Current record blocks")}}',
          children: [
            {
              key: 'details',
              type: 'item',
              title: '{{t("Details")}}',
              component: 'SnapshotBlockInitializersDetailItem',
              actionInitializers: 'CalendarFormActionInitializers',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: '{{t("Other blocks")}}',
          children: [
            {
              key: 'markdown',
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

export const snapshotBlockInitializers = new SchemaInitializerV2({
  name: 'SnapshotBlockInitializers',
  'data-testid': 'add-block-button-in-snapshot-block',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Current record blocks")}}',
      name: 'current-record-blocks',
      children: [
        {
          name: 'details',
          title: '{{t("Details")}}',
          Component: 'SnapshotBlockInitializersDetailItem',
          actionInitializers: 'CalendarFormActionInitializers',
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
