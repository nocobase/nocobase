/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useDesignable, useNocoBaseRoutes } from '../..';
import { SchemaSettings } from '../../../application/schema-settings';
import { useSchemaToolbar } from '../../../application/schema-toolbar';
import { useCurrentRoute } from '../../../route-switch';

function useNotDisableHeader() {
  const fieldSchema = useFieldSchema();
  return !fieldSchema['x-component-props']?.disablePageHeader;
}

/**
 * @deprecated
 */
export const pageSettings = new SchemaSettings({
  name: 'PageSettings',
  items: [
    {
      name: 'enablePageHeader',
      type: 'switch',
      useComponentProps() {
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        return {
          title: t('Enable page header'),
          checked: !fieldSchema['x-component-props']?.disablePageHeader,
          onChange(v) {
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['disablePageHeader'] = !v;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                ['x-component-props']: fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
      useVisible: useNotDisableHeader,
    },
    {
      name: 'displayPageTitle',
      type: 'switch',
      useVisible: useNotDisableHeader,
      useComponentProps() {
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        return {
          title: t('Display page title'),
          checked: !fieldSchema['x-component-props']?.hidePageTitle,
          onChange(v) {
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['hidePageTitle'] = !v;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                ['x-component-props']: fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'editPageTitle',
      type: 'modal',
      useVisible() {
        const notDisablePageHeader = useNotDisableHeader();
        const fieldSchema = useFieldSchema();
        const notHidePageTitle = !fieldSchema['x-component-props']?.hidePageTitle;

        return notDisablePageHeader && notHidePageTitle;
      },
      useComponentProps() {
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { title } = useSchemaToolbar();
        return {
          hide: true,
          title: t('Edit page title'),
          schema: {
            type: 'object',
            title: t('Edit page title'),
            properties: {
              title: {
                title: t('Title'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema,
          initialValues: { title },
          onSubmit({ title }) {
            field.title = title;
            fieldSchema['title'] = title;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
              },
            });
          },
        };
      },
    },
    {
      name: 'enablePageTabs',
      type: 'switch',
      useVisible: useNotDisableHeader,
      useComponentProps() {
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const currentRoute = useCurrentRoute();
        const { updateRoute } = useNocoBaseRoutes();
        return {
          title: t('Enable page tabs'),
          checked: currentRoute.enableTabs,
          async onChange(v) {
            // 更新路由
            await updateRoute(currentRoute.id, {
              enableTabs: v,
            });

            // enableTabs 已经保存在 route 中了，按说这里不需要加了。但 E2E 中需要这个参数。
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['enablePageTabs'] = v;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                ['x-component-props']: fieldSchema['x-component-props'],
              },
            });
          },
        };
      },
    },
  ],
});
