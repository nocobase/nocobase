import { MenuOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { createDesignable, Resizable, SchemaInitializerV2, useAPIClient, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const auditLogsTableActionColumnInitializers = new SchemaInitializerV2({
  name: 'AuditLogsTableActionColumnInitializers',
  insertPosition: 'beforeEnd',
  Component: () => <MenuOutlined style={{ cursor: 'pointer' }} />,
  useInsert() {
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const { refresh } = useDesignable();
    const { t } = useTranslation();

    return (schema) => {
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
    };
  },
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("View")}}',
          component: 'AuditLogsViewActionInitializer',
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
      title: '{{t("Column width")}}',
      component: Resizable,
    },
  ],
});
