import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from '../utils';

export const TableSelectorInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: t('Selector'),
          children: [
            {
              key: 'details',
              type: 'item',
              title: 'Table',
              component: 'TableSelectorInitializer',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: t('Other blocks'),
          children: [
            {
              type: 'item',
              title: t('Add text'),
              component: 'BlockInitializer',
              schema: {
                type: 'void',
                'x-editable': false,
                'x-decorator': 'BlockItem',
                'x-designer': 'Markdown.Void.Designer',
                'x-component': 'Markdown.Void',
                'x-component-props': {
                  content: t('This is a demo text, **supports Markdown syntax**.'),
                },
              },
            },
          ],
        },
      ]}
    />
  );
};
