import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection } from '../..';
import { gridRowColWrap } from '../utils';

const useRelationFields = () => {
  const { fields } = useCollection();
  return fields
    .filter((field) => field.interface === 'linkTo')
    .map((field) => {
      return {
        type: 'item',
        field,
        title: field?.uiSchema?.title || field.name,
        component: 'RecordAssociationBlockInitializer',
      };
    }) as any;
};

export const RecordBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      title={t('Add block')}
      items={[
        {
          type: 'itemGroup',
          title: '当前数据区块',
          children: [
            {
              type: 'item',
              title: 'Details',
              component: 'RecordReadPrettyFormBlockInitializer',
            },
            {
              type: 'item',
              title: 'Form',
              component: 'RecordFormBlockInitializer',
            },
          ],
        },
        {
          type: 'itemGroup',
          title: '关系数据区块',
          children: useRelationFields(),
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
