import { MenuOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useAPIClient } from '../../api-client';
import { createDesignable, useDesignable } from '../../schema-component';

export const TableActionColumnInitializers = (props: any) => {
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      insert={(schema) => {
        const spaceSchema = fieldSchema.reduceProperties((buf, schema) => {
          if (schema['x-component'] === 'Space') {
            return schema;
          }
          return buf;
        }, null);
        if (!spaceSchema) {
          return;
        }
        const dn = createDesignable({
          api,
          refresh,
          current: spaceSchema,
        });
        dn.loadAPIClientEvents();
        dn.insertBeforeEnd(schema);
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Enable actions'),
          children: [
            {
              type: 'item',
              title: t('View'),
              component: 'ViewActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'view',
                'x-decorator': 'ACLActionProvider',
              },
            },
            {
              type: 'item',
              title: t('Edit'),
              component: 'UpdateActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'update',
                'x-decorator': 'ACLActionProvider',
              },
            },
            {
              type: 'item',
              title: t('Delete'),
              component: 'DestroyActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'destroy',
                'x-decorator': 'ACLActionProvider',
              },
            },
          ],
        },
      ]}
      component={<MenuOutlined style={{ cursor: 'pointer' }} />}
    />
  );
};
