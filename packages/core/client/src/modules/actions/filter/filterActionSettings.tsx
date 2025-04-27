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
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { FilterableFieldsSchemaSettingsItem } from '../../../schema-component/antd/filter/Filter.Action.Designer';
import { useDesignable } from '../../../schema-component/hooks';

export const filterActionSettings = new SchemaSettings({
  name: 'actionSettings:filter',
  items: [
    {
      name: 'FilterableFields',
      Component: FilterableFieldsSchemaSettingsItem,
    },
    {
      name: 'divider',
      type: 'divider',
    },
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
                default: fieldSchema.title,
                'x-component-props': {},
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: t('Button icon'),
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
              },
              onlyIcon: {
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
                title: t('Icon only'),
                default: fieldSchema?.['x-component-props']?.onlyIcon,
                'x-component-props': {},
                'x-reactions': [
                  {
                    dependencies: ['icon'],
                    fulfill: {
                      state: {
                        hidden: '{{!$deps[0]}}',
                      },
                    },
                  },
                ],
              },
            },
          } as ISchema,
          onSubmit: ({ title, icon, onlyIcon }) => {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            field.componentProps.onlyIcon = onlyIcon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            fieldSchema['x-component-props'].onlyIcon = onlyIcon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
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
      name: 'delete',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: (s) => {
          return s['x-component'] === 'Space' || s['x-component'] === 'ActionBar';
        },
      },
    },
  ],
});
