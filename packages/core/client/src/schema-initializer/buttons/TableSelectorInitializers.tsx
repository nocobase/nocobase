import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection } from '../..';
import { gridRowColWrap } from '../utils';

export const TableSelectorInitializers = (props: any) => {
  const { t } = useTranslation();
  const { name } = useCollection();
  const { insertPosition, component } = props;

  return (
    <SchemaInitializer.Button
      data-testid="add-block-button-in-table-selector"
      wrap={gridRowColWrap}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      insertPosition={insertPosition}
      component={component}
      items={[
        {
          key: 'dataBlocksInTableSelector',
          type: 'itemGroup',
          title: t('Selector'),
          children: [
            {
              key: 'detailsBlockInTableSelector',
              type: 'item',
              title: 'Table',
              component: 'TableSelectorInitializer',
            },
          ],
        },
        {
          key: 'filterBlocksInTableSelector',
          type: 'itemGroup',
          title: '{{t("Filter blocks")}}',
          children: [
            {
              key: 'filterFormBlockInTableSelector',
              type: 'item',
              title: '{{t("Form")}}',
              component: 'FilterFormBlockInitializer',
              name,
            },
            {
              key: 'filterCollapseBlockInTableSelector',
              type: 'item',
              title: '{{t("Collapse")}}',
              component: 'FilterCollapseBlockInitializer',
              name,
            },
          ],
        },
        {
          key: 'otherBlocksInTableSelector',
          type: 'itemGroup',
          title: t('Other blocks'),
          children: [
            {
              key: 'markdownBlockInTableSelector',
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
