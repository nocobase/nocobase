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

export const GroupItem = () => {
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles();
  const parentRoute = useParentRoute();
  const { createRoute } = useNocoBaseRoutes();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add group'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    title: {
                      title: t('Menu item title'),
                      'x-component': 'Input',
                      'x-decorator': 'FormItem',
                      required: true,
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
    const { title, icon } = values;
    const schemaUid = uid();

    // 创建一个路由到 desktopRoutes 表中
    await createRoute({
      type: NocoBaseDesktopRouteType.group,
      title,
      icon,
      parentId: parentRoute?.id,
      schemaUid,
    });
  }, [options.components, options.scope, t, theme]);
  return <SchemaInitializerItem title={t('Group')} onClick={handleClick} className={`${componentCls} ${hashId}`} />;
};
