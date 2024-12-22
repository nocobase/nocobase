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
import { createMemoryHistory } from 'history';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Router } from 'react-router-dom';
import { SchemaInitializerItem, useSchemaInitializer } from '../../application';
import { useGlobalTheme } from '../../global-theme';
import { NocoBaseDesktopRoute, RouteType } from '../../route-switch/antd/admin-layout/convertRoutesToSchema';
import {
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useDesktopRoutes,
  useParentRoute,
} from '../../schema-component';
import { useStyles } from '../../schema-component/antd/menu/MenuItemInitializers';
import { useURLAndHTMLSchema } from '../actions/link/useURLAndHTMLSchema';

export const LinkMenuItem = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles();
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
  const parentRoute = useParentRoute();
  const { resource } = useDesktopRoutes();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add link'),
      () => {
        const history = createMemoryHistory();
        return (
          <Router location={history.location} navigator={history}>
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
                      href: urlSchema,
                      params: paramsSchema,
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          </Router>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { title, href, params, icon } = values;
    const schemaUid = uid();

    // 创建一个路由到 desktopRoutes 表中
    resource.create({
      values: {
        type: RouteType.link,
        title: values.title,
        icon: values.icon,
        parentId: parentRoute?.id,
        schemaUid,
        options: {
          href,
          params,
        },
      } as NocoBaseDesktopRoute,
    });

    // 同时插入一个对应的 Schema
    insert({
      type: 'void',
      title,
      'x-component': 'Menu.URL',
      'x-decorator': 'ACLMenuItemProvider',
      'x-component-props': {
        icon,
        href,
        params,
      },
      'x-server-hooks': [
        {
          type: 'onSelfCreate',
          method: 'bindMenuToRole',
        },
        {
          type: 'onSelfSave',
          method: 'extractTextToLocale',
        },
      ],
      'x-uid': schemaUid,
    });
  }, [insert, options.components, options.scope, t, theme]);

  return <SchemaInitializerItem title={t('Link')} onClick={handleClick} className={`${componentCls} ${hashId}`} />;
};
