/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

const commonOptions = {
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
};

/**
 * @deprecated
 * use `auditLogsTableActionColumnInitializers` instead
 */
export const auditLogsTableActionColumnInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'AuditLogsTableActionColumnInitializers',
  ...commonOptions,
});

export const auditLogsTableActionColumnInitializers = new CompatibleSchemaInitializer(
  {
    name: 'auditLogsTable:configureItemActions',
    ...commonOptions,
  },
  auditLogsTableActionColumnInitializers_deprecated,
);
