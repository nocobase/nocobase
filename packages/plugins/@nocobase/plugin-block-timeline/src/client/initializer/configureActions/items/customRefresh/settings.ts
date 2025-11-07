/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, useDesignable } from '@nocobase/client';
import { ActionNameLowercase } from './constants';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useCustomRefreshActionProps } from './schema';

export const customRefreshActionSettings = new SchemaSettings({
  name: `actionSettings:${ActionNameLowercase}`,
  items: [
    {
      name: 'EditButton',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { t } = useTranslation();

        return {
          title: t('Edit button'),
          schema: {
            type: 'object',
            title: t('Edit button'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Button title'),
                default: fieldSchema?.['x-component-props']?.['title'] || '刷新',
                'x-component-props': {},
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: t('Button icon'),
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
              },
            },
          } as ISchema,
          onSubmit: ({ title, icon }) => {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            fieldSchema['x-component-props'].title = title;
            fieldSchema['x-use-component-props'] = useCustomRefreshActionProps.bind(null, { title: title });

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
                // 'x-use-component-props': fieldSchema['x-use-component-props'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});
