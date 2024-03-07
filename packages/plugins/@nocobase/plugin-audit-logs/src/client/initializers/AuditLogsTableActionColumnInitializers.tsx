import { MenuOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import {
  CompatibleSchemaInitializer,
  createDesignable,
  Resizable,
  useAPIClient,
  useDesignable,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * @deprecated
 */
export const auditLogsTableActionColumnInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'AuditLogsTableActionColumnInitializers',
  insertPosition: 'beforeEnd',
  Component: (props: any) => <MenuOutlined {...props} style={{ cursor: 'pointer' }} />,
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
      name: 'enableActions',
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          name: 'view',
          type: 'item',
          title: '{{t("View")}}',
          Component: 'AuditLogsViewActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'view',
            'x-decorator': 'ACLActionProvider',
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'columnWidth',
      type: 'item',
      title: '{{t("Column width")}}',
      Component: Resizable,
    },
  ],
});

export const auditLogsTableActionColumnInitializers = new CompatibleSchemaInitializer(
  {
    name: 'auditLogsTable:configureItemActions',
    insertPosition: 'beforeEnd',
    Component: (props: any) => <MenuOutlined {...props} style={{ cursor: 'pointer' }} />,
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
        name: 'enableActions',
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        children: [
          {
            name: 'view',
            type: 'item',
            title: '{{t("View")}}',
            Component: 'AuditLogsViewActionInitializer',
            schema: {
              'x-component': 'Action.Link',
              'x-action': 'view',
              'x-decorator': 'ACLActionProvider',
            },
          },
        ],
      },
      {
        name: 'divider',
        type: 'divider',
      },
      {
        name: 'columnWidth',
        type: 'item',
        title: '{{t("Column width")}}',
        Component: Resizable,
      },
    ],
  },
  auditLogsTableActionColumnInitializers_deprecated,
);
