import { MenuOutlined } from '@ant-design/icons';
import { ISchema, useFieldSchema } from '@formily/react';
import { createDesignable, SchemaInitializer, SchemaSettings, useAPIClient, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const Resizable = (props) => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaSettings.ModalItem
      title={t('Column width')}
      schema={
        {
          type: 'object',
          title: t('Column width'),
          properties: {
            width: {
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {},
              default: fieldSchema?.['x-component-props']?.width || 200,
            },
          },
        } as ISchema
      }
      onSubmit={({ width }) => {
        const props = fieldSchema['x-component-props'] || {};
        props['width'] = width;
        const schema: ISchema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = props;
        fieldSchema['x-component-props'] = props;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

export const AuditLogsTableActionColumnInitializers = (props: any) => {
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
          t,
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
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Column width'),
          component: Resizable,
        },
      ]}
      component={<MenuOutlined style={{ cursor: 'pointer' }} />}
    />
  );
};
