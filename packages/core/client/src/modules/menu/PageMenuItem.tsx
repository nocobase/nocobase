/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client/hooks/useAPIClient';
import { SchemaInitializerItem } from '../../application';
import { useGlobalTheme } from '../../global-theme';
import { NocoBaseDesktopRouteType } from '../../route-switch/antd/admin-layout/convertRoutesToSchema';
import {
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useNocoBaseRoutes,
  useParentRoute,
} from '../../schema-component';
import { useStyles } from '../../schema-component/antd/menu/MenuItemInitializers';

export const useInsertPageSchema = () => {
  const api = useAPIClient();
  return useCallback(
    async (schema) => {
      await api.request({
        method: 'POST',
        url: '/uiSchemas:insert',
        data: schema,
      });
    },
    [api],
  );
};

export const PageMenuItem = () => {
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles();
  const parentRoute = useParentRoute();
  const { createRoute } = useNocoBaseRoutes();
  const insertPageSchema = useInsertPageSchema();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add page'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    title: {
                      title: t('Menu item title'),
                      required: true,
                      'x-component': 'Input',
                      'x-decorator': 'FormItem',
                    },
                    icon: {
                      title: t('Icon'),
                      'x-component': 'IconPicker',
                      'x-decorator': 'FormItem',
                    },
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const menuSchemaUid = uid();
    const pageSchemaUid = uid();
    const tabSchemaUid = uid();
    const tabSchemaName = uid();

    // 创建一个路由到 desktopRoutes 表中
    await createRoute({
      type: NocoBaseDesktopRouteType.page,
      title: values.title,
      icon: values.icon,
      parentId: parentRoute?.id,
      schemaUid: pageSchemaUid,
      menuSchemaUid,
      enableTabs: false,
      children: [
        {
          type: NocoBaseDesktopRouteType.tabs,
          schemaUid: tabSchemaUid,
          tabSchemaName,
          hidden: true,
        },
      ],
    });

    // 同时插入一个对应的 Schema
    insertPageSchema(getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName }));
  }, [createRoute, insertPageSchema, options?.components, options?.scope, parentRoute?.id, t, theme]);
  return <SchemaInitializerItem title={t('Page')} onClick={handleClick} className={`${componentCls} ${hashId}`} />;
};

export function getPageMenuSchema({ pageSchemaUid, tabSchemaUid, tabSchemaName }) {
  return {
    type: 'void',
    'x-component': 'Page',
    properties: {
      [tabSchemaName]: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {},
        'x-uid': tabSchemaUid,
        'x-async': true,
      },
    },
    'x-uid': pageSchemaUid,
  };
}
