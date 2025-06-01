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
import { SchemaInitializerItem, useApp } from '../../application';
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
import { createPage } from '../../flow';

export const FlowPageMenuItem = () => {
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles();
  const parentRoute = useParentRoute();
  const { createRoute } = useNocoBaseRoutes();
  const app = useApp();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add Flow Page'),
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

    const flowPageConfig = createPage({
      title: values.title,
      route: {
        tabs: [],
      },
    });

    await createRoute({
      type: NocoBaseDesktopRouteType.flowPage,
      title: values.title,
      icon: values.icon,
      parentId: parentRoute?.id,
      schemaUid: flowPageConfig.uid,
      menuSchemaUid: uid(),
      enableTabs: false,
    });
  }, [createRoute, options?.components, options?.scope, parentRoute?.id, t, theme, app]);

  return <SchemaInitializerItem title={t('Flow page')} onClick={handleClick} className={`${componentCls} ${hashId}`} />;
};

export function getFlowPageMenuSchema({
  pageSchemaUid,
  title,
}: {
  pageSchemaUid: string;
  tabSchemaUid?: string;
  tabSchemaName?: string;
  title?: string;
}) {
  return {
    type: 'void',
    'x-component': 'FlowPage',
    'x-component-props': {
      title: title || 'Flow Page',
      modelUid: pageSchemaUid,
      tabs: [{ title: 'Tab1', content: '' }],
    },
    'x-uid': pageSchemaUid,
  };
}
