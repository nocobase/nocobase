import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from '../utils';

export const CreateFormBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      insertPosition={insertPosition}
      component={component}
      items={[
        {
          type: 'itemGroup',
          title: '{{t("Data blocks")}}',
          children: [
            {
              type: 'item',
              title: '{{t("Form")}}',
              component: 'CreateFormBlockInitializer',
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
