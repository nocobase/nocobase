import { uid } from '@formily/shared';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAPIClient } from '..';
import { SchemaInitializer } from '../schema-initializer/SchemaInitializer';

export const AddBlockTemplate = (props: any) => {
  const { t } = useTranslation();
  const history = useHistory();
  const api = useAPIClient();
  return (
    <SchemaInitializer.Button
      type={'primary'}
      style={{
        color: undefined,
        borderColor: undefined,
      }}
      designable={true}
      insert={(uiSchema) => {
        const key = uid();
        api
          .resource('uiSchemaTemplates')
          .create({
            values: {
              key,
              uiSchema,
            },
          })
          .then((res) => {
            history.push(`/admin/block-templates/${key}`);
          });
      }}
      items={[
        {
          type: 'item',
          title: 'Table',
          component: 'TableBlockInitializer',
        },
        {
          type: 'item',
          title: 'Form',
          component: 'FormBlockInitializer',
        },
        {
          type: 'item',
          title: 'Calendar',
          component: 'CalendarBlockInitializer',
        },
        {
          type: 'item',
          title: 'Kanban',
          component: 'KanbanBlockInitializer',
        },
      ]}
    >
      {t('Add block template')}
    </SchemaInitializer.Button>
  );
};
