import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection } from '../..';
import { useAPIClient } from '../../api-client';
import { useDesignable } from '../../schema-component';
import { gridRowColWrap } from './utils';

const useRelationFields = () => {
  const { fields } = useCollection();
  return fields.filter(field => field.interface === 'linkTo').map((field) => {
    return {
      type: 'item',
      field,
      title: field?.uiSchema?.title || field.name,
      component: 'RecordRelationBlockInitializer',
    };
  }) as any;
};

// 当前行记录所在面板的添加区块
export const RecordBlockInitializers = (props: any) => {
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { refresh } = useDesignable();
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
              component: 'RecordFormBlockInitializer',
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
