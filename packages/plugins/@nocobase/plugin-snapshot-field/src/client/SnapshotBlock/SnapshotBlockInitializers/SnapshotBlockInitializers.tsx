import { SchemaInitializer, gridRowColWrap } from '@nocobase/client';
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
