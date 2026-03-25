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
import {
  FormDialog,
  SchemaComponent,
  SchemaComponentOptions,
  useNocoBaseRoutes,
  useParentRoute,
  zIndexContext,
  ICON_POPUP_Z_INDEX,
} from '../../schema-component';
import { useStyles } from '../../schema-component/antd/menu/MenuItemInitializers';

export const FlowPageMenuItem = () => {
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { componentCls, hashId } = useStyles();
  const parentRoute = useParentRoute();
  const { createV2 } = useNocoBaseRoutes();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add page'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              {/* 防止按钮的配置弹窗的图标弹窗被遮挡 */}
              <zIndexContext.Provider value={ICON_POPUP_Z_INDEX}>
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
              </zIndexContext.Provider>
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const pageSchemaUid = uid();

    await createV2({
      schemaUid: pageSchemaUid,
      parentId: parentRoute?.id,
      title: values.title,
      icon: values.icon,
    });
  }, [createV2, options?.components, options?.scope, parentRoute?.id, t, theme]);
  return (
    <SchemaInitializerItem
      title={t('Modern page (v2)')}
      onClick={handleClick}
      className={`${componentCls} ${hashId}`}
    />
  );
};

export function getFlowPageMenuSchema({ pageSchemaUid }) {
  return {
    type: 'void',
    'x-component': 'FlowRoute',
    'x-uid': pageSchemaUid,
  };
}
