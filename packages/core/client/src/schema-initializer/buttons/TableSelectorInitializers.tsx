import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { gridRowColWrap } from '../utils';

export const TableSelectorInitializers = (props: any) => {
  const { t } = useTranslation();
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
          key: 'dataBlocks',
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
          key: 'filterBlocks',
          type: 'itemGroup',
          title: '{{t("Filter blocks")}}',
          children: [
            {
              key: 'filterForm',
              type: 'item',
              title: '{{t("Form")}}',
              component: 'FilterFormBlockInitializer',
            },
            {
              key: 'filterCollapse',
              type: 'item',
              title: '{{t("Collapse")}}',
              component: 'FilterCollapseBlockInitializer',
            },
          ],
        },
        {
          key: 'otherBlocks',
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
